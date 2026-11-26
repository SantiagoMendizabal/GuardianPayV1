import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  MapPin, 
  UserX, 
  DollarSign, 
  Database, 
  CheckCircle2, 
  BarChart3, 
  Zap,
  Sparkles,
  Layers,
  Fingerprint,
  Lock
} from 'lucide-react';
import { obtenerEstadisticasDashboardAPI } from '../services/aiFraudEngine';

export default function DashboardAuditoria({ onBack, onNavigateTransfer }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  // Funciones para enmascaramiento de privacidad (PCI-DSS / SOC Compliance)
  const maskUserName = (name) => {
    if (!name || name === "Usuario") return "Titular ***";
    const parts = name.trim().split(/\s+/);
    return parts.map(p => {
      if (p.length <= 2) return p + "***";
      if (p.length <= 4) return p.slice(0, 2) + "***";
      return p.slice(0, 2) + "***" + p.slice(-1);
    }).join(" ");
  };

  const maskPhone = (phone) => {
    if (!phone) return "9** *** *21";
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length >= 8) {
      return `${digits.slice(0, 3)} *** ${digits.slice(-2)}`;
    }
    return `${digits.slice(0, 2)}***`;
  };

  const maskOperationCode = (code) => {
    if (!code) return "OP-***";
    if (code.includes("-")) {
      const parts = code.split("-");
      const prefix = parts[0];
      const val = parts.slice(1).join("-");
      if (val.length > 4) {
        return `${prefix}-${val.slice(0, 2)}***${val.slice(-2)}`;
      }
      return `${prefix}-***`;
    }
    return code.length > 4 ? `${code.slice(0, 2)}***${code.slice(-2)}` : `${code}***`;
  };

  // Función para cargar métricas desde FastAPI / MySQL
  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await obtenerEstadisticasDashboardAPI();
      setData(result.data);
      setIsFallback(Boolean(result.isFallback));
      setLastUpdated(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Error al cargar estadísticas del dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const resumen = data?.resumen || {
    total_operaciones: 0,
    operaciones_aprobadas: 0,
    transacciones_interceptadas: 0,
    tasa_fraude_pct: 0,
    latencia_promedio_ms: 0
  };

  const variablesRanking = data?.ranking_variables_fraude || [];
  const ultimasAuditorias = data?.ultimas_auditorias || [];
  const variableMasCritica = data?.variable_mas_critica || "Ninguna";

  // Función auxiliar para obtener icono de la variable
  const getVariableIcon = (id) => {
    switch (id) {
      case 'madrugada':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'contacto':
        return <UserX className="w-4 h-4 text-purple-500" />;
      case 'monto':
        return <DollarSign className="w-4 h-4 text-rose-500" />;
      case 'ubicacion':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="w-full text-slate-800 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 1. Header Card Superior del Dashboard (Tarjeta limpia, sin solapamiento de scroll) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Volver a la billetera"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-yape-700 bg-yape-50 border border-yape-200 px-3 py-1 rounded-full">
                Supervisión de Ciberseguridad & XAI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Dashboard de Auditoría IA & SOC
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {isFallback ? (
            <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Modo Demostración</span>
            </div>
          ) : (
            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MySQL & FastAPI Activo</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-extrabold bg-yape-700 hover:bg-yape-800 text-white px-4 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sincronizando...' : 'Refrescar'}</span>
          </button>
        </div>

      </div>

      {/* 2. Banner de Variable Más Crítica (Alerta XAI) */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-rose-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Factor Detonante Predominante de Fraude
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {variableMasCritica}
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-2xl">
                El modelo predictivo Random Forest identifica este factor como la mayor causa de intercepciones y activación del paso biométrico 3D.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 self-stretch sm:self-auto justify-center">
            <Clock className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-semibold">
              Último cómputo: {lastUpdated || 'Cargando...'}
            </span>
          </div>
        </div>

        {/* Círculo decorativo */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 3. Cuatro Tarjetas KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Evaluaciones */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Total Evaluadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {resumen.total_operaciones}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Registros en <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">auditoria_ia</code></span>
          </div>
        </div>

        {/* KPI 2: Tasa de Fraude */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Tasa de Fraude
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {resumen.tasa_fraude_pct}%
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({resumen.transacciones_interceptadas} casos)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Score ≥ 70% o Desafío Biométrico</span>
          </div>
        </div>

        {/* KPI 3: Operaciones Aprobadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Operaciones Aprobadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {resumen.operaciones_aprobadas}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Transacciones legítimas procesadas</span>
          </div>
        </div>

        {/* KPI 4: Latencia de Inferencia */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Latencia Promedio
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700 tracking-tight">
              {resumen.latencia_promedio_ms}
            </span>
            <span className="text-xs font-extrabold text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {Number(resumen.latencia_promedio_ms) <= 25 
                ? "Meta bancaria óptima (< 25 ms)"
                : Number(resumen.latencia_promedio_ms) <= 100
                ? "Inferencia ágil (< 100 ms)"
                : "Inferencia completa de 120 árboles"}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Sección Intermedia: Ranking XAI de Factores & Arquitectura de Decisión */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda (7 Cols): Ranking de Variables Detonantes */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yape-50 text-yape-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Ranking de Variables de Fraude (XAI)
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Incidencia porcentual sobre las operaciones interceptadas
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-yape-700 bg-yape-50 px-2.5 py-1 rounded-lg">
              Explicabilidad
            </span>
          </div>

          {/* Lista de Barras de Progreso */}
          <div className="space-y-4 pt-1">
            {variablesRanking.map((item, index) => {
              const colorMap = [
                'bg-rose-500',
                'bg-amber-500',
                'bg-purple-500',
                'bg-blue-500'
              ];
              const barColor = colorMap[index % colorMap.length];

              return (
                <div key={item.id || index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getVariableIcon(item.id)}
                      <span className="font-bold text-slate-800">{item.variable}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{item.casos} alertas</span>
                      <span className="font-black text-slate-900 font-mono">{item.porcentaje}%</span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium pl-6">
                    {item.descripcion}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yape-700 shrink-0" />
            <span>
              <b>Insight de Ciberseguridad:</b> Las transferencias nocturnas combinadas con destinatarios no registrados elevan la probabilidad de fraude por encima del umbral crítico.
            </span>
          </div>
        </div>

        {/* Columna Derecha (5 Cols): Arquitectura y Mecanismo Step-Up 2FA */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tarjeta de Especificación del Modelo */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Modelo Random Forest
                </h3>
                <p className="text-xs text-slate-400 font-medium">GuardianShield Predictor v3.4</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block">Bosque de Árboles</span>
                <span className="text-lg font-black text-slate-900">120 árboles</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block">Métrica ROC-AUC</span>
                <span className="text-lg font-black text-emerald-600">&ge; 0.94</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block">Recall de Fraude</span>
                <span className="text-lg font-black text-purple-700">&ge; 91.2%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block">Balanceo SMOTE</span>
                <span className="text-lg font-black text-blue-600">60% Ratio</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Contingencia Biometría 3D */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-mint font-extrabold text-xs uppercase tracking-wider">
              <Fingerprint className="w-4 h-4" />
              <span>Step-Up Authentication (2FA)</span>
            </div>
            <h4 className="text-base font-black tracking-tight text-white">
              Resolución mediante Biometría Facial 3D
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cuando el score de riesgo alcanza o supera el <b>70%</b>, la transacción entra en retención preventiva y se invoca el modal con cámara activa para cotejo con el vector 128D guardado en MySQL.
            </p>
            {onNavigateTransfer && (
              <button
                type="button"
                onClick={onNavigateTransfer}
                className="w-full text-xs font-extrabold bg-mint hover:bg-mint/90 text-slate-950 py-2.5 rounded-xl transition-all cursor-pointer mt-2"
              >
                Probar Simulación en Transferencias &rarr;
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 5. Tabla de Supervisión en Tiempo Real: Últimas Auditorías */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Últimas Transacciones Auditadas por la IA
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Inspección en vivo de los últimos 10 eventos procesados por el motor predictivo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Datos enmascarados (Privacidad SOC)</span>
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              10 registros
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Código / Hora</th>
                <th className="py-3 px-4">Usuario Emisor</th>
                <th className="py-3 px-4">Monto Evaluado</th>
                <th className="py-3 px-4">Factores de Riesgo</th>
                <th className="py-3 px-4 text-center">Score IA</th>
                <th className="py-3 px-4 text-center">Decisión</th>
                <th className="py-3 px-4 text-right">Latencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {ultimasAuditorias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Aún no hay transacciones registradas en la tabla de auditoría.
                  </td>
                </tr>
              ) : (
                ultimasAuditorias.map((item) => {
                  const isBlocked = item.decision === 'DESAFIO_BIOMETRICO' || item.score >= 70;
                  const isAlert = item.decision === 'APROBADO_CON_ALERTA' || (item.score >= 40 && item.score < 70);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Código y Hora (Enmascarado) */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800 text-xs">
                          {maskOperationCode(item.operationCode || `OP-${item.id}`)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.createdAt || item.hora || 'Hoy'}
                        </div>
                      </td>

                      {/* Usuario y Teléfono (Enmascarados para Privacidad) */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {maskUserName(item.userName)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {maskPhone(item.userPhone)}
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="py-3.5 px-4 font-bold font-sans text-slate-900">
                        S/ {Number(item.monto || 0).toFixed(2)}
                      </td>

                      {/* Factores Detectados */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.esMadrugada && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                              Madrugada
                            </span>
                          )}
                          {item.esContactoNuevo && (
                            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                              Contacto Nuevo
                            </span>
                          )}
                          {item.esUbicacionInusual && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                              Ubicación Anómala
                            </span>
                          )}
                          {item.monto > 200 && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">
                              Monto &gt; S/ 200
                            </span>
                          )}
                          {!item.esMadrugada && !item.esContactoNuevo && !item.esUbicacionInusual && item.monto <= 200 && (
                            <span className="text-[10px] font-medium text-slate-400">
                              Sin anomalías
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Score IA */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-black font-mono text-xs px-2.5 py-1 rounded-xl ${
                          isBlocked ? 'bg-rose-100 text-rose-700' :
                          isAlert ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {Number(item.score || 0).toFixed(1)}%
                        </span>
                      </td>

                      {/* Decisión IA */}
                      <td className="py-3.5 px-4 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            Interceptado
                          </span>
                        ) : isAlert ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Alerta Leve
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aprobado
                          </span>
                        )}
                      </td>

                      {/* Latencia */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 font-semibold">
                        {Number(item.tiempoMs || item.tiempo_inferencia_ms || 18).toFixed(1)} ms
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
