import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Gauge, Navigation, Compass, Zap, MapPin } from 'lucide-react';

// Componente para ajustar dinámicamente la vista del mapa para encuadrar ambos pines
function AutoFitBounds({ posA, posB }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !posA || !posB) return;
    try {
      const bounds = L.latLngBounds([posA, posB]);
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 13,
        animate: true
      });
    } catch (e) {
      console.warn('[ImpossibleTravelMap] Error ajustando vista:', e);
    }
  }, [map, posA, posB]);

  return null;
}

// Icono personalizado SVG para Pin A (Última Ubicación / Origen)
const createPinAIcon = (label) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
        <div style="background: rgba(16, 185, 129, 0.95); color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.3); margin-bottom: 3px;">
          📍 ${label || 'Última Ubicación'}
        </div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px; box-shadow: 0 0 14px rgba(16, 185, 129, 0.8);">
          A
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #10b981;"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// Icono personalizado SVG para Pin B (Ubicación Sospechosa / Destino con Pulso)
const createPinBIcon = (label) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
        <div style="background: rgba(239, 68, 68, 0.95); color: white; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 900; white-space: nowrap; box-shadow: 0 2px 8px rgba(239,68,68,0.6); border: 1px solid rgba(255,255,255,0.4); margin-bottom: 3px; animation: pulse 1.5s infinite;">
          ⚠️ ${label || 'Actual Sospechosa'}
        </div>
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #ef4444; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 13px; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);">
            B
          </div>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #ef4444;"></div>
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 46]
  });
};

export default function ImpossibleTravelMap({ travelData }) {
  // Coordenadas por defecto en caso de no recibir data
  const defaultOrigin = {
    name: "Arequipa Centro (Habitual)",
    lat: -16.409047,
    lng: -71.537451
  };
  const defaultDest = {
    name: "Lima Metropolitana (Detectada)",
    lat: -12.046374,
    lng: -77.042793
  };

  const origin = travelData?.origin || defaultOrigin;
  const destination = travelData?.destination || defaultDest;
  const distanceKm = typeof travelData?.distance_km === 'number' ? travelData.distance_km : 1010.0;
  const speedKmh = typeof travelData?.speed_kmh === 'number' ? travelData.speed_kmh : 1212.0;
  const elapsedMinutes = typeof travelData?.elapsed_minutes === 'number' ? travelData.elapsed_minutes : 1.0;

  const posA = [origin.lat, origin.lng];
  const posB = [destination.lat, destination.lng];
  const centerPos = [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-red-500/50 bg-slate-950/90 shadow-2xl relative my-3">
      
      {/* Banner Superior con Telemetría Cinemática Haversine */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-950 p-3 border-b border-red-500/30 text-white">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-red-300 font-extrabold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Viaje Imposible Detectado (Haversine)</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/30 border border-red-400/50 text-red-200 font-black">
            VELOCIDAD CRÍTICA
          </span>
        </div>

        {/* Métricas clave en Grid */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-red-800/40 text-center font-mono">
          <div className="bg-black/40 p-2 rounded-xl border border-white/5">
            <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">Distancia Real</div>
            <div className="text-xs sm:text-sm font-black text-amber-300">{distanceKm.toLocaleString('es-PE')} km</div>
          </div>
          <div className="bg-black/40 p-2 rounded-xl border border-white/5">
            <div className="text-[9px] text-slate-400 uppercase font-sans font-bold">Tiempo</div>
            <div className="text-xs sm:text-sm font-black text-slate-200">{elapsedMinutes} min</div>
          </div>
          <div className="bg-black/40 p-2 rounded-xl border border-red-500/30 bg-red-950/40">
            <div className="text-[9px] text-red-400 uppercase font-sans font-bold">Velocidad</div>
            <div className="text-xs sm:text-sm font-black text-red-400 animate-pulse">{speedKmh.toLocaleString('es-PE')} km/h</div>
          </div>
        </div>

        <div className="text-[10px] text-slate-300 mt-2 flex items-center justify-between font-sans">
          <span>Límite físico permitido: <b className="text-emerald-400 font-mono">120 km/h</b></span>
          <span className="text-red-300 font-mono font-bold">Físicamente Imposible</span>
        </div>
      </div>

      {/* Contenedor del Mapa Leaflet Interactivo */}
      <div className="h-56 sm:h-64 w-full relative z-0">
        <MapContainer
          center={centerPos}
          zoom={5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
        >
          {/* Tiles con Tema Oscuro (CartoDB Dark Matter) */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Ajuste automático de Bounds para ambos marcadores */}
          <AutoFitBounds posA={posA} posB={posB} />

          {/* Línea Roja Punteada que une los dos puntos */}
          <Polyline
            positions={[posA, posB]}
            pathOptions={{
              color: '#ef4444',
              weight: 3.5,
              dashArray: '8, 8',
              opacity: 0.95
            }}
          />

          {/* Pin A: Última Ubicación */}
          <Marker position={posA} icon={createPinAIcon(origin.name)}>
            <Popup className="custom-leaflet-popup">
              <div className="text-xs text-slate-900 p-1">
                <div className="font-bold text-emerald-700">📍 Pin A: Última Ubicación</div>
                <div className="font-semibold text-slate-800">{origin.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Lat: {origin.lat.toFixed(4)}, Lng: {origin.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Pin B: Ubicación Actual / Sospechosa */}
          <Marker position={posB} icon={createPinBIcon(destination.name)}>
            <Popup className="custom-leaflet-popup">
              <div className="text-xs text-slate-900 p-1">
                <div className="font-bold text-red-600">🚨 Pin B: Ubicación Sospechosa</div>
                <div className="font-semibold text-slate-800">{destination.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Lat: {destination.lat.toFixed(4)}, Lng: {destination.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Pie de Telemetría Geodésica */}
      <div className="p-2.5 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            De <b className="text-white">{origin.name}</b> a <b className="text-white">{destination.name}</b>
          </span>
        </div>
        <div className="text-[10px] font-mono text-amber-400 shrink-0 ml-2 font-bold">
          Δ = {distanceKm} km
        </div>
      </div>

    </div>
  );
}
