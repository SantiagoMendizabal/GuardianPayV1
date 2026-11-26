"""
GuardianPay AI - GeoService & Impossible Travel Engine (Incremento 3)
Autor: Jonathan Amanca / GuardianPay Team

Funcionalidades:
1. Extracción de IP real desde X-Forwarded-For (Caddy/Nginx en Azure) o request.client.host.
2. Consulta resiliente a API GeoIP externa (ip-api.com / ipwho.is) con timeout <= 0.8s y caché en memoria.
3. Fallback inteligente a coordenadas base de Arequipa para IPs locales (127.0.0.1) o sin conexión.
4. Cálculo matemático exacto con la fórmula de Haversine:
   d = 2R · arcsin( √( sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2) ) )
5. Detección cinemática de "Viaje Imposible":
   distancia >= 20 km y velocidad > 120 km/h -> impossible_travel = True.
"""

import math
import json
import re
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

# Constantes Geodésicas
EARTH_RADIUS_KM = 6371.0  # Radio promedio de la Tierra en kilómetros

# Coordenadas base por defecto (Arequipa Centro, Plaza de Armas)
DEFAULT_BASE_GEO: Dict[str, Any] = {
    "ip": "127.0.0.1",
    "city": "Arequipa",
    "region": "Arequipa",
    "country": "Perú",
    "country_code": "PE",
    "lat": -16.409047,
    "lng": -71.537451,
    "is_local": True,
    "source": "default_local_arequipa"
}

# Nodos conocidos para mapeo y simulación de ataque VPN/Spoofing
KNOWN_NODES: Dict[str, Dict[str, Any]] = {
    "arequipa": {
        "city": "Arequipa",
        "lat": -16.409047,
        "lng": -71.537451,
        "label": "Arequipa Centro (Habitual)"
    },
    "la joya": {
        "city": "La Joya",
        "lat": -16.592500,
        "lng": -71.916700,
        "label": "Otro Distrito (+25 km - La Joya/Yura)"
    },
    "otro distrito": {
        "city": "La Joya / Yura",
        "lat": -16.592500,
        "lng": -71.916700,
        "label": "Otro Distrito (+25 km)"
    },
    "lima": {
        "city": "Lima",
        "lat": -12.046374,
        "lng": -77.042793,
        "label": "Lima Metropolitana (+1,010 km)"
    },
    "ip extranjera": {
        "city": "Miami",
        "lat": 25.761681,
        "lng": -80.191788,
        "label": "Miami / VPN Extranjera (+4,500 km)"
    },
    "miami": {
        "city": "Miami",
        "lat": 25.761681,
        "lng": -80.191788,
        "label": "Miami / VPN Extranjera (+4,500 km)"
    }
}

# Caché en memoria por IP para garantizar latencia < 80 ms (Riesgo 2)
_GEO_CACHE: Dict[str, Dict[str, Any]] = {}


def is_private_or_local_ip(ip: Optional[str]) -> bool:
    """Verifica si la IP es local (localhost, Docker, LAN o vacía)."""
    if not ip:
        return True
    clean_ip = ip.strip().lower()
    if clean_ip in ("127.0.0.1", "localhost", "::1", "testclient", "0.0.0.0"):
        return True
    # Rangos privados RFC 1918 / Docker
    if clean_ip.startswith("10.") or clean_ip.startswith("192.168."):
        return True
    if clean_ip.startswith("172."):
        try:
            second_octet = int(clean_ip.split(".")[1])
            if 16 <= second_octet <= 31:
                return True
        except (IndexError, ValueError):
            pass
    return False


def extract_client_ip(request: Any) -> str:
    """
    Paso 1: Extrae la IP pública real del cliente.
    Prioridad:
    1. Header X-Forwarded-For (enviado por Nginx/Caddy en Azure)
    2. Header X-Real-IP
    3. request.client.host
    """
    if not request:
        return "127.0.0.1"

    headers = getattr(request, "headers", {})

    # 1. X-Forwarded-For puede contener 'cliente, proxy1, proxy2'
    forwarded_for = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For")
    if forwarded_for:
        parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
        for p in parts:
            if not is_private_or_local_ip(p):
                return p
        if parts:
            return parts[0]

    # 2. X-Real-IP
    real_ip = headers.get("x-real-ip") or headers.get("X-Real-IP")
    if real_ip and not is_private_or_local_ip(real_ip):
        return real_ip.strip()

    # 3. Host directo
    client = getattr(request, "client", None)
    if client and getattr(client, "host", None):
        return client.host.strip()

    return "127.0.0.1"


def resolve_ip_geolocation(ip: str, timeout: float = 0.8) -> Dict[str, Any]:
    """
    Consulta API GeoIP con timeout estricto de 0.8 s y caché en memoria.
    Retorna diccionario con latitud, longitud, ciudad, país y estado.
    """
    clean_ip = (ip or "").strip()

    # Si es IP local o privada, devolver coordenadas base Arequipa
    if is_private_or_local_ip(clean_ip):
        result = dict(DEFAULT_BASE_GEO)
        result["ip"] = clean_ip or "127.0.0.1"
        return result

    # Verificar caché en memoria (< 1 ms de latencia)
    if clean_ip in _GEO_CACHE:
        return _GEO_CACHE[clean_ip]

    # Intentar consultar ip-api.com (gratuito, sin API key, máx 45 req/min)
    geo_data: Optional[Dict[str, Any]] = None
    try:
        url = f"http://ip-api.com/json/{clean_ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,query"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "GuardianPay-GeoService/3.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
            if payload.get("status") == "success":
                geo_data = {
                    "ip": clean_ip,
                    "city": payload.get("city") or "Desconocida",
                    "region": payload.get("regionName") or "",
                    "country": payload.get("country") or "Perú",
                    "country_code": payload.get("countryCode") or "PE",
                    "lat": float(payload.get("lat", DEFAULT_BASE_GEO["lat"])),
                    "lng": float(payload.get("lon", DEFAULT_BASE_GEO["lng"])),
                    "is_local": False,
                    "source": "ip-api.com"
                }
    except Exception as exc:
        # Fallback silencioso para cumplir con latencia y no derribar la transacción
        geo_data = None

    # Fallback secundario a ipwho.is si ip-api falló o fue bloqueado
    if not geo_data:
        try:
            url_backup = f"https://ipwho.is/{clean_ip}"
            req_backup = urllib.request.Request(
                url_backup,
                headers={"User-Agent": "GuardianPay-GeoService/3.0"}
            )
            with urllib.request.urlopen(req_backup, timeout=timeout) as resp_backup:
                p_backup = json.loads(resp_backup.read().decode("utf-8"))
                if p_backup.get("success"):
                    geo_data = {
                        "ip": clean_ip,
                        "city": p_backup.get("city") or "Desconocida",
                        "region": p_backup.get("region") or "",
                        "country": p_backup.get("country") or "Perú",
                        "country_code": p_backup.get("country_code") or "PE",
                        "lat": float(p_backup.get("latitude", DEFAULT_BASE_GEO["lat"])),
                        "lng": float(p_backup.get("longitude", DEFAULT_BASE_GEO["lng"])),
                        "is_local": False,
                        "source": "ipwho.is"
                    }
        except Exception:
            pass

    # Si ambas APIs externas fallan o agotan timeout, usar fallback seguro
    if not geo_data:
        geo_data = dict(DEFAULT_BASE_GEO)
        geo_data["ip"] = clean_ip
        geo_data["source"] = "fallback_timeout_safety"

    # Guardar en caché en memoria
    _GEO_CACHE[clean_ip] = geo_data
    return geo_data


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Paso 2: Coordenadas reales (lat, lng) + fórmula de Haversine
    d = 2R · arcsin( √( sin²(Δφ/2) + cos(φ1) · cos(φ2) · sin²(Δλ/2) ) )
    φ = latitud, λ = longitud (en radianes), R = radio de la Tierra (≈ 6371 km)
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    sin_half_dphi = math.sin(delta_phi / 2.0)
    sin_half_dlambda = math.sin(delta_lambda / 2.0)

    a = (sin_half_dphi ** 2) + math.cos(phi1) * math.cos(phi2) * (sin_half_dlambda ** 2)
    # Evitar posibles errores de precisión flotante fuera de [0.0, 1.0]
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.asin(math.sqrt(a))
    dist_km = EARTH_RADIUS_KM * c
    return round(dist_km, 2)


def resolve_coordinates_for_location_string(location_name: Optional[str]) -> Tuple[float, float, str]:
    """Resuelve coordenadas para nombres o etiquetas históricas de transacciones."""
    if not location_name:
        return DEFAULT_BASE_GEO["lat"], DEFAULT_BASE_GEO["lng"], "Arequipa Centro"

    loc_clean = location_name.strip().lower()
    for key, node in KNOWN_NODES.items():
        if key in loc_clean:
            return node["lat"], node["lng"], node["label"]

    return DEFAULT_BASE_GEO["lat"], DEFAULT_BASE_GEO["lng"], location_name


def evaluate_impossible_travel(
    prev_lat: float,
    prev_lng: float,
    prev_time: datetime,
    curr_lat: float,
    curr_lng: float,
    curr_time: datetime,
    origin_name: str = "Ubicación Previa",
    dest_name: str = "Ubicación Actual",
    is_gps: bool = False,
    min_distance_km: float = 20.0,
    max_physical_speed_kmh: float = 120.0
) -> Dict[str, Any]:
    """
    Evalúa cinemáticamente si el cambio de ubicación entre dos transacciones
    representa un viaje físicamente imposible:
    - Distancia >= 20 km
    - Velocidad calculada = distancia / horas transcurridas > 120 km/h
    """
    distance_km = haversine_distance_km(prev_lat, prev_lng, curr_lat, curr_lng)

    # Tiempo transcurrido en segundos, minutos y horas
    elapsed_seconds = max(1.0, abs((curr_time - prev_time).total_seconds()))
    elapsed_minutes = round(elapsed_seconds / 60.0, 1)
    elapsed_hours = max(0.00833, elapsed_seconds / 3600.0)  # Mínimo 30 seg para cálculo de velocidad

    speed_kmh = round(distance_km / elapsed_hours, 1)

    # Condición de viaje imposible
    is_impossible = (distance_km >= min_distance_km) and (speed_kmh > max_physical_speed_kmh)

    detail_msg = ""
    if is_impossible:
        detail_msg = (
            f"Salto geográfico de {distance_km:,.1f} km en {elapsed_minutes} min "
            f"(Velocidad calculada: {speed_kmh:,.0f} km/h > {max_physical_speed_kmh:.0f} km/h). "
            f"Físicamente imposible entre {origin_name} y {dest_name}."
        )

    return {
        "impossible_travel": is_impossible,
        "distance_km": distance_km,
        "speed_kmh": speed_kmh,
        "elapsed_seconds": elapsed_seconds,
        "elapsed_minutes": elapsed_minutes,
        "elapsed_hours": round(elapsed_hours, 4),
        "threshold_dist_km": min_distance_km,
        "threshold_speed_kmh": max_physical_speed_kmh,
        "origin": {
            "name": origin_name,
            "lat": prev_lat,
            "lng": prev_lng
        },
        "destination": {
            "name": dest_name,
            "lat": curr_lat,
            "lng": curr_lng
        },
        "is_gps": is_gps,
        "detail": detail_msg
    }
