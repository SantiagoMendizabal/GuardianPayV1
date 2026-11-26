"""
geo_service.py — GuardianPay Incremento 3
Servicio de Geolocalización y Detección de Viaje Imposible

Funciones:
  - extract_client_ip(request)         → IP real del cliente (X-Forwarded-For / host)
  - resolve_ip_geolocation(ip)         → Consulta ip-api.com con caché + timeout 0.8s
  - haversine_distance_km(lat1, lng1, lat2, lng2)  → Distancia real en km
  - evaluate_impossible_travel(...)    → Detecta >= 20 km a > 120 km/h
  - resolve_coordinates_for_location_string(name)  → Coordenadas desde nombre de ciudad
"""

import math
import time
import threading
from datetime import datetime
from typing import Optional, Dict, Any

try:
    import urllib.request
    import json as _json
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Coordenadas de nodos conocidos (fallback cuando la IP es local)
# ---------------------------------------------------------------------------
KNOWN_NODES: Dict[str, Dict[str, Any]] = {
    "arequipa":    {"lat": -16.409047, "lng": -71.537451, "city": "Arequipa",    "country": "Perú"},
    "la joya":     {"lat": -16.592500, "lng": -71.916700, "city": "La Joya",     "country": "Perú"},
    "yura":        {"lat": -16.244200, "lng": -71.676100, "city": "Yura",        "country": "Perú"},
    "lima":        {"lat": -12.046374, "lng": -77.042793, "city": "Lima",        "country": "Perú"},
    "miami":       {"lat":  25.761681, "lng": -80.191788, "city": "Miami",       "country": "Estados Unidos"},
    "cusco":       {"lat": -13.531950, "lng": -71.967463, "city": "Cusco",       "country": "Perú"},
    "trujillo":    {"lat":  -8.112879, "lng": -79.028798, "city": "Trujillo",    "country": "Perú"},
    "moquegua":    {"lat": -17.193830, "lng": -70.935459, "city": "Moquegua",    "country": "Perú"},
}

# Coordenadas base cuando no hay IP válida ni GPS (Arequipa Centro)
DEFAULT_BASE_GEO: Dict[str, Any] = {
    "lat": -16.409047, "lng": -71.537451,
    "city": "Arequipa", "region": "Arequipa",
    "country": "Perú", "is_local": True,
    "source": "default_arequipa"
}

# ---------------------------------------------------------------------------
# Caché en memoria de GeoIP (evita llamadas repetidas, cumple Riesgo 2)
# ---------------------------------------------------------------------------
_GEO_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL_SECONDS = 3600  # 1 hora


def _cache_get(ip: str) -> Optional[Dict[str, Any]]:
    with _CACHE_LOCK:
        entry = _GEO_CACHE.get(ip)
        if entry and (time.time() - entry["_ts"]) < _CACHE_TTL_SECONDS:
            return entry
    return None


def _cache_set(ip: str, data: Dict[str, Any]) -> None:
    with _CACHE_LOCK:
        data["_ts"] = time.time()
        _GEO_CACHE[ip] = data


# ---------------------------------------------------------------------------
# Paso 1 — Extraer IP real del cliente
# ---------------------------------------------------------------------------
def extract_client_ip(request) -> str:
    """
    Lee la IP real del cliente en este orden de prioridad:
      1. X-Forwarded-For (primer IP de la cadena — la del cliente real)
      2. X-Real-IP
      3. request.client.host (fallback directo del socket TCP)
    """
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        ip = xff.split(",")[0].strip()
        if ip:
            return ip

    xri = request.headers.get("x-real-ip", "")
    if xri:
        return xri.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


# ---------------------------------------------------------------------------
# Paso 1b — Resolver geolocalización por IP con caché + timeout 0.8s
# ---------------------------------------------------------------------------
def resolve_ip_geolocation(ip: str) -> Dict[str, Any]:
    """
    Consulta ip-api.com (HTTP desde backend Python — cumple Riesgo 3).
    Respeta Riesgo 2: timeout=0.8s + caché en memoria por 1h.
    Si la IP es local/privada (127.x, 192.168.x, 10.x), retorna DEFAULT_BASE_GEO.
    """
    # IPs locales o privadas → no hay GeoIP real
    if _is_private_ip(ip):
        return {**DEFAULT_BASE_GEO, "ip": ip}

    # Revisar caché primero
    cached = _cache_get(ip)
    if cached:
        return cached

    # Consulta a ip-api.com (gratuito, máx 45 req/min, solo HTTP desde backend)
    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,city,regionName,country,lat,lon,query"
        req = urllib.request.Request(url, headers={"User-Agent": "GuardianPay/3.0"})
        with urllib.request.urlopen(req, timeout=0.8) as resp:
            data = _json.loads(resp.read().decode())

        if data.get("status") == "success":
            result = {
                "ip": ip,
                "city": data.get("city", "Desconocida"),
                "region": data.get("regionName", ""),
                "country": data.get("country", ""),
                "lat": float(data.get("lat", DEFAULT_BASE_GEO["lat"])),
                "lng": float(data.get("lon", DEFAULT_BASE_GEO["lng"])),
                "is_local": False,
                "source": "ip-api.com"
            }
            _cache_set(ip, result)
            return result
    except Exception:
        pass  # Timeout o error de red — continuar con fallback

    # Fallback: ipwho.is como segundo intento
    try:
        url2 = f"https://ipwho.is/{ip}"
        req2 = urllib.request.Request(url2, headers={"User-Agent": "GuardianPay/3.0"})
        with urllib.request.urlopen(req2, timeout=0.8) as resp2:
            data2 = _json.loads(resp2.read().decode())

        if data2.get("success"):
            result2 = {
                "ip": ip,
                "city": data2.get("city", "Desconocida"),
                "region": data2.get("region", ""),
                "country": data2.get("country", ""),
                "lat": float(data2.get("latitude", DEFAULT_BASE_GEO["lat"])),
                "lng": float(data2.get("longitude", DEFAULT_BASE_GEO["lng"])),
                "is_local": False,
                "source": "ipwho.is"
            }
            _cache_set(ip, result2)
            return result2
    except Exception:
        pass

    # Caso C: Falla total de GeoIP → retornar base sin caerse (Riesgo 3)
    return {**DEFAULT_BASE_GEO, "ip": ip, "source": "fallback_offline"}


def _is_private_ip(ip: str) -> bool:
    """Detecta IPs locales/privadas que no tienen GeoIP válido."""
    return (
        ip.startswith("127.")
        or ip.startswith("192.168.")
        or ip.startswith("10.")
        or ip.startswith("172.16.")
        or ip.startswith("172.17.")
        or ip.startswith("172.18.")
        or ip.startswith("::1")
        or ip == "localhost"
        or ip == "testclient"
    )


# ---------------------------------------------------------------------------
# Paso 2 — Fórmula de Haversine (distancia real en km)
# ---------------------------------------------------------------------------
def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calcula la distancia geodésica entre dos puntos en la superficie terrestre.

    d = 2R · arcsin( √( sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2) ) )
    φ = latitud, λ = longitud (en radianes), R = 6371 km

    Ejemplo: Arequipa (-16.409, -71.537) → Lima (-12.046, -77.043) ≈ 1,009 km
    """
    R = 6371.0  # Radio de la Tierra en km

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lng2 - lng1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return round(R * c, 2)


# ---------------------------------------------------------------------------
# Paso 2b — Resolver coordenadas desde nombre de ubicación (string)
# ---------------------------------------------------------------------------
def resolve_coordinates_for_location_string(location_name: str) -> tuple:
    """
    Convierte un nombre de ubicación a (lat, lng, nombre_normalizado).
    Busca en KNOWN_NODES primero. Si no encuentra, retorna Arequipa por defecto.
    """
    if not location_name:
        return DEFAULT_BASE_GEO["lat"], DEFAULT_BASE_GEO["lng"], "Arequipa"

    name_lower = location_name.lower()
    for key, node in KNOWN_NODES.items():
        if key in name_lower or name_lower in key:
            return node["lat"], node["lng"], node["city"]

    # Si menciona "inusual", "extranjera", "vpn", "miami" → usar Miami
    if any(w in name_lower for w in ["inusual", "extranjera", "vpn", "proxy", "miami"]):
        return KNOWN_NODES["miami"]["lat"], KNOWN_NODES["miami"]["lng"], "Miami (VPN)"

    return DEFAULT_BASE_GEO["lat"], DEFAULT_BASE_GEO["lng"], "Arequipa"


# ---------------------------------------------------------------------------
# Paso 2c — Detectar Viaje Imposible con Haversine
# ---------------------------------------------------------------------------
def evaluate_impossible_travel(
    prev_lat: float,
    prev_lng: float,
    prev_time: datetime,
    curr_lat: float,
    curr_lng: float,
    curr_time: datetime,
    origin_name: str = "Ubicación anterior",
    dest_name: str = "Ubicación actual",
    is_gps: bool = False,
    max_speed_kmh: float = 120.0,
    min_distance_km: float = 20.0
) -> Dict[str, Any]:
    """
    Evalúa si existe un "Viaje Imposible" entre dos transacciones.

    Reglas:
      - Distancia >= min_distance_km (default 20 km)
      - Velocidad implícita > max_speed_kmh (default 120 km/h)
      → impossible_travel = True

    Mitiga Riesgo 1 (IPs móviles Perú):
      - Si is_gps=False y distancia < 50 km → NO bloquear (puede ser error GeoIP)
      - Solo bloquear estrictamente cuando is_gps=True o distancia > 50 km

    Returns dict con distancia_km, velocidad_kmh, impossible_travel, detail
    """
    distancia_km = haversine_distance_km(prev_lat, prev_lng, curr_lat, curr_lng)

    # Calcular tiempo transcurrido en horas
    delta_seconds = abs((curr_time - prev_time).total_seconds())
    delta_hours = max(delta_seconds / 3600.0, 1 / 3600.0)  # mínimo 1 segundo para evitar /0

    velocidad_kmh = round(distancia_km / delta_hours, 1)

    # Criterio estricto de viaje imposible
    es_imposible_base = distancia_km >= min_distance_km and velocidad_kmh > max_speed_kmh

    # Riesgo 1: Mitigación para IPs móviles peruanas (sin GPS)
    # Si no hay GPS y la distancia es < 50km → puede ser error de GeoIP (Claro/Movistar)
    if es_imposible_base and not is_gps and distancia_km < 50.0:
        es_imposible = False
        detail = (
            f"Variación de IP detectada ({distancia_km:.1f} km, {velocidad_kmh:.0f} km/h). "
            f"Sin GPS: posible imprecisión de operadora móvil (Claro/Movistar). "
            f"Factor de riesgo registrado pero sin bloqueo automático."
        )
    elif es_imposible_base:
        es_imposible = True
        delta_min = round(delta_seconds / 60, 1)
        detail = (
            f"VIAJE IMPOSIBLE detectado: {distancia_km:.1f} km en {delta_min:.1f} min "
            f"→ {velocidad_kmh:.0f} km/h (límite: {max_speed_kmh:.0f} km/h). "
            f"Origen: {origin_name} → Destino: {dest_name}. "
            f"{'(GPS de alta precisión)' if is_gps else '(GeoIP)'}"
        )
    else:
        es_imposible = False
        detail = (
            f"Desplazamiento normal: {distancia_km:.1f} km en "
            f"{round(delta_seconds/60, 1):.1f} min → {velocidad_kmh:.0f} km/h"
        )

    return {
        "impossible_travel": es_imposible,
        "distancia_km": distancia_km,
        "velocidad_kmh": velocidad_kmh,
        "delta_seconds": delta_seconds,
        "origin": {"name": origin_name, "lat": prev_lat, "lng": prev_lng},
        "destination": {"name": dest_name, "lat": curr_lat, "lng": curr_lng},
        "is_gps": is_gps,
        "detail": detail,
        "timestamp": curr_time.isoformat()
    }
