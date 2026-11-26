import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Gauge, AlertTriangle, MapPin } from 'lucide-react';

// Pin A (Verde - Última ubicación legítima)
const pinOriginIcon = L.divIcon({
  className: 'custom-pin-origin',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
    <span style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(16,185,129,0.28);"></span>
    <span style="width:14px;height:14px;border-radius:9999px;background:#10b981;border:2.5px solid #ecfdf5;box-shadow:0 0 12px #10b981;"></span>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Pin B (Rojo con pulso - Ubicación sospechosa actual)
const pinDestIcon = L.divIcon({
  className: 'custom-pin-dest',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
    <span style="position:absolute;width:32px;height:32px;border-radius:9999px;background:rgba(239,68,68,0.45);animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <span style="width:15px;height:15px;border-radius:9999px;background:#ef4444;border:2.5px solid #fef2f2;box-shadow:0 0 14px #ef4444;"></span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Ajusta el zoom automáticamente para encuadrar Pin A y Pin B
function AutoFitBounds({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (!origin || !destination) return;
    const bounds = L.latLngBounds(
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    );
    map.fitBounds(bounds, { padding: [38, 38], maxZoom: 12 });
  }, [map, origin, destination]);
  return null;
}

export default function ImpossibleTravelMap({ travelData }) {
  if (!travelData || !travelData.origin || !travelData.destination) {
    return null;
  }

  const {
    origin,
    destination,
    distancia_km = 0,
    velocidad_kmh = 0,
    is_gps = false
  } = travelData;

  const center = [
    (origin.lat + destination.lat) / 2,
    (origin.lng + destination.lng) / 2
  ];

  const routePositions = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng]
  ];

  return (
    <div className="bg-slate-950/90 border border-red-500/40 rounded-2xl overflow-hidden shadow-xl shadow-red-950/40">
      {/* Cabecera cinemática Haversine */}
      <div className="px-3.5 py-2.5 bg-red-950/60 border-b border-red-500/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-red-300">
              Mapa de Viaje Imposible (Haversine)
            </p>
            <p className="text-[10px] text-slate-400">
              {origin.name} → {destination.name} ({is_gps ? 'GPS Satelital' : 'GeoIP / Nodo'})
            </p>
          </div>
        </div>
      </div>

      {/* Mapa oscuro Leaflet */}
      <div className="relative h-48 w-full z-0">
        <MapContainer
          center={center}
          zoom={6}
          scrollWheelZoom={false}
          attributionControl={false}
          className="h-full w-full bg-slate-900"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <AutoFitBounds origin={origin} destination={destination} />

          {/* Pin A: Última ubicación legítima */}
          <Marker position={[origin.lat, origin.lng]} icon={pinOriginIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong className="text-emerald-700">Pin A · Última Ubicación</strong>
                <div>{origin.name}</div>
                <div className="text-[10px] text-slate-500">
                  {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Pin B: Ubicación actual sospechosa */}
          <Marker position={[destination.lat, destination.lng]} icon={pinDestIcon}>
            <Popup>
              <div className="text-xs font-sans">
                <strong className="text-red-700">Pin B · Ubicación Sospechosa</strong>
                <div>{destination.name}</div>
                <div className="text-[10px] text-slate-500">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Línea roja punteada que une Pin A y Pin B */}
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#ef4444',
              weight: 3,
              dashArray: '8, 8',
              opacity: 0.9
            }}
          />
        </MapContainer>
      </div>

      {/* HUD inferior con métricas exactas */}
      <div className="grid grid-cols-2 divide-x divide-red-500/20 bg-slate-900/95 border-t border-red-500/30">
        <div className="px-3 py-2 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Distancia Haversine</p>
            <p className="text-xs font-black text-white font-mono">
              {Number(distancia_km).toLocaleString('es-PE', { maximumFractionDigits: 1 })} km
            </p>
          </div>
        </div>
        <div className="px-3 py-2 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Velocidad Calculada</p>
            <p className="text-xs font-black text-red-400 font-mono">
              {Number(velocidad_kmh).toLocaleString('es-PE', { maximumFractionDigits: 0 })} km/h
            </p>
          </div>
        </div>
      </div>

      {/* Leyenda rápida de pines */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Pin A: {origin.name}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-red-400 inline" />
          Pin B: {destination.name}
        </span>
      </div>
    </div>
  );
}
