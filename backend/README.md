# Backend - Servicio de Machine Learning (Próximamente)

Este directorio está reservado para el microservicio de detección de fraudes mediante el algoritmo **Random Forest** (Scikit-Learn en Python con FastAPI o Flask).

### Estructura Prevista:
- `main.py` -> API REST (FastAPI) con endpoint `POST /predict_fraud`.
- `model/random_forest_fraud.pkl` -> Modelo de Machine Learning entrenado.
- `requirements.txt` -> Dependencias (`fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `joblib`).
- `train_model.py` -> Script para entrenar el modelo con el dataset de transacciones.
