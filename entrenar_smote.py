"""
GuardianPay - Sprint 3 | Actividad 2: SMOTE + GridSearchCV + reentrenamiento
Responsable: Jonathan (Data Science / MLOps)

Funciona en Google Colab y en local.
  Colab : !pip install -q imbalanced-learn  -> subir el CSV -> ejecutar este archivo
  Local : pip install imbalanced-learn      -> python entrenar_smote.py   (desde la raíz del proyecto)

Salidas:
  backend/model/random_forest_fraud.pkl   (RandomForestClassifier de 120 árboles, listo para main.py)
  backend/model/model_metadata.json       (métricas reales, las lee el backend)
  backend/model/matriz_confusion.png
  backend/model/curva_roc.png
"""
import json
import os
import time
import warnings

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import sklearn
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (ConfusionMatrixDisplay, RocCurveDisplay, classification_report,
                             confusion_matrix, recall_score, roc_auc_score)
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split

warnings.filterwarnings("ignore")

# ----------------------------------------------------------------------------
# 0. Configuración
# ----------------------------------------------------------------------------
CSV_PATH = os.environ.get("GP_CSV", "backend/data/dataset_transacciones_guardianpay.csv")
MODEL_DIR = os.environ.get("GP_MODEL_DIR", "backend/model")
SEED = 42
UMBRAL = 0.70                      # umbral de intervención del sistema (DESAFIO_BIOMETRICO)
FORZAR_120_ARBOLES = True          # el backend/documentación asumen un bosque de 120 árboles

FEATURES = ["monto", "hora", "es_madrugada", "es_contacto_nuevo",
            "es_ubicacion_inusual", "saldo_previo", "intentos_fallidos"]
TARGET = "es_fraude"

os.makedirs(MODEL_DIR, exist_ok=True)

# ----------------------------------------------------------------------------
# 1. Cargar dataset
# ----------------------------------------------------------------------------
df = pd.read_csv(CSV_PATH)
X, y = df[FEATURES], df[TARGET]
print(f"Registros: {len(df):,}")
print("Distribución de clases (original):")
print(y.value_counts().rename({0: "legítimo", 1: "fraude"}).to_string())
print(f"  -> fraude = {y.mean()*100:.2f}%\n")

# ----------------------------------------------------------------------------
# 2. Partición estratificada 80/20 (el test NUNCA se toca con SMOTE)
# ----------------------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=SEED)
print(f"Train: {len(X_train):,} | Test: {len(X_test):,} (fraude test = {y_test.mean()*100:.2f}%)")

# ----------------------------------------------------------------------------
# 3. Demostración de SMOTE (para las capturas / sustentación)
# ----------------------------------------------------------------------------
smote_demo = SMOTE(sampling_strategy=0.60, random_state=SEED)
X_res, y_res = smote_demo.fit_resample(X_train, y_train)
print("\nTrain ANTES de SMOTE :", dict(y_train.value_counts().sort_index()))
print("Train DESPUÉS de SMOTE:", dict(y_res.value_counts().sort_index()),
      "(minoritaria = 60% de la mayoritaria)\n")

# ----------------------------------------------------------------------------
# 4. GridSearchCV con SMOTE DENTRO de cada fold (evita fuga de datos)
#    imblearn.Pipeline aplica SMOTE solo a los folds de entrenamiento y deja
#    cada fold de validación con datos 100% reales.
# ----------------------------------------------------------------------------
pipe = Pipeline([
    ("smote", SMOTE(sampling_strategy=0.60, random_state=SEED)),
    ("rf", RandomForestClassifier(random_state=SEED, n_jobs=-1)),
])

param_grid = {
    "rf__n_estimators": [120] if FORZAR_120_ARBOLES else [100, 120, 150],
    "rf__max_depth": [8, 10, 12, None],
    "rf__min_samples_split": [2, 5],
    "rf__class_weight": ["balanced", None],
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
grid = GridSearchCV(pipe, param_grid, cv=cv, scoring="roc_auc", n_jobs=1, verbose=1)

t0 = time.time()
grid.fit(X_train, y_train)
print(f"\nGridSearch terminado en {time.time()-t0:.0f}s")
print("Mejores hiperparámetros:", grid.best_params_)
print(f"ROC-AUC en validación cruzada: {grid.best_score_:.4f}")

# El modelo final es el RandomForest solo (main.py necesita .estimators_ y .feature_importances_)
best_rf: RandomForestClassifier = grid.best_estimator_.named_steps["rf"]

# ----------------------------------------------------------------------------
# 5. Evaluación en el TEST REAL (sin SMOTE)
# ----------------------------------------------------------------------------
proba = best_rf.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, proba)
pred_umbral = (proba >= UMBRAL).astype(int)
pred_050 = (proba >= 0.50).astype(int)

print("\n" + "=" * 60)
print(f"ROC-AUC (test real)          : {auc:.4f}")
print(f"Recall fraude  (umbral 0.50) : {recall_score(y_test, pred_050):.3f}")
print(f"Recall fraude  (umbral {UMBRAL:.2f}) : {recall_score(y_test, pred_umbral):.3f}")
print("=" * 60)
print(f"\nReporte de clasificación (umbral {UMBRAL:.2f}):")
print(classification_report(y_test, pred_umbral, target_names=["Legítimo", "Fraude"]))
tn, fp, fn, tp = confusion_matrix(y_test, pred_umbral).ravel()
print(f"Matriz de confusión -> TN={tn} FP={fp} FN={fn} TP={tp}")

if auc < 0.92:
    print("\n[AVISO] ROC-AUC < 0.92. Revisa la calidad del dataset (ver nota en la guía) "
          "antes de afirmar la meta en la sustentación.")

# ----------------------------------------------------------------------------
# 6. Gráficos para el informe
# ----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(5, 4))
ConfusionMatrixDisplay.from_predictions(y_test, pred_umbral, display_labels=["Legítimo", "Fraude"],
                                        cmap="Blues", ax=ax)
ax.set_title(f"Matriz de confusión (umbral {UMBRAL:.0%})")
fig.tight_layout(); fig.savefig(os.path.join(MODEL_DIR, "matriz_confusion.png"), dpi=150); plt.close(fig)

fig, ax = plt.subplots(figsize=(5, 4))
RocCurveDisplay.from_predictions(y_test, proba, name=f"RF + SMOTE (AUC={auc:.3f})", ax=ax)
ax.plot([0, 1], [0, 1], "k--", lw=1); ax.set_title("Curva ROC - conjunto de prueba real")
fig.tight_layout(); fig.savefig(os.path.join(MODEL_DIR, "curva_roc.png"), dpi=150); plt.close(fig)

# ----------------------------------------------------------------------------
# 7. Guardar modelo + metadatos (mismo formato que ya lee backend/main.py)
# ----------------------------------------------------------------------------
joblib.dump(best_rf, os.path.join(MODEL_DIR, "random_forest_fraud.pkl"))

metadata = {
    "model_name": "GuardianPay-RandomForest",
    "version": "3.0.0",
    "features": FEATURES,
    "threshold": UMBRAL,
    "roc_auc_score": round(float(auc), 4),
    "accuracy": round(float((pred_umbral == y_test).mean()), 4),
    "recall_fraude": round(float(recall_score(y_test, pred_umbral)), 4),
    "balanceo": "SMOTE sampling_strategy=0.60 (solo train, dentro de CV)",
    "n_estimators": int(best_rf.n_estimators),
    "hiperparametros": {k.replace("rf__", ""): v for k, v in grid.best_params_.items()},
    "sklearn_version": sklearn.__version__,
}
with open(os.path.join(MODEL_DIR, "model_metadata.json"), "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"\n[OK] Guardado en {MODEL_DIR}/: random_forest_fraud.pkl, model_metadata.json, "
      f"matriz_confusion.png, curva_roc.png")
print(f"[OK] Árboles en el bosque: {len(best_rf.estimators_)}")