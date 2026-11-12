import os
import sys
from collections import Counter
from datetime import datetime

# Configurar codificación utf-8 en consola de Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from database import SessionLocal
from models import User, Transaction, ContactoFrecuente

def mostrar_perfiles_bancarios():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id.asc()).all()
        
        print("\n" + "="*88)
        print("   GUARDIANPAY AI - PERFILADO TRANSACCIONAL Y HÁBITOS DE USUARIO EN MYSQL")
        print("="*88)
        print(f" Fecha del reporte: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f" Base de Datos: MySQL 8.0 (guardianpay_db)")
        print(f" Cuentas analizadas: {len(users)}\n")

        print(f"{'ID':<4} | {'TITULAR':<22} | {'TELÉFONO':<10} | {'SALDO':<11} | {'TXS':<4} | {'PROMEDIO':<11} | {'RANGO':<14}")
        print("-" * 88)

        detalles_usuarios = []

        for u in users:
            # Consultar todas las transferencias enviadas por este usuario
            txs = db.query(Transaction).filter(
                Transaction.sender_id == u.id,
                Transaction.status == "COMPLETADO"
            ).all()

            count = len(txs)
            amounts = [t.amount for t in txs]
            
            if amounts:
                avg_monto = sum(amounts) / count
                min_monto = min(amounts)
                max_monto = max(amounts)
                rango_str = f"S/{min_monto:.0f} - S/{max_monto:.0f}"
            else:
                avg_monto = 80.0  # Baseline por defecto para cuentas nuevas
                rango_str = "Sin historial"

            # Horas más frecuentes
            hours = []
            locations = []
            for t in txs:
                if t.time_str:
                    hours.append(t.time_str)
                if t.location_str:
                    locations.append(t.location_str)

            common_hour = Counter(hours).most_common(1)[0][0] if hours else "Sin registro"
            common_loc = Counter(locations).most_common(1)[0][0] if locations else "Arequipa (Base)"

            # Contactos frecuentes
            cf_count = db.query(ContactoFrecuente).filter(ContactoFrecuente.user_id == u.id).count()

            print(f"{u.id:<4} | {u.name[:22]:<22} | {u.phone:<10} | S/ {u.balance:>7.2f} | {count:<4} | S/ {avg_monto:>7.2f} | {rango_str:<14}")

            detalles_usuarios.append({
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "balance": u.balance,
                "tx_count": count,
                "avg_monto": avg_monto,
                "rango": rango_str,
                "common_hour": common_hour,
                "common_loc": common_loc,
                "cf_count": cf_count
            })

        print("-" * 88)
        print("\n" + "="*88)
        print("   ANÁLISIS DE COMPORTAMIENTO Y HÁBITOS DE GASTO (BASELINE INDIVIDUAL)")
        print("="*88)

        for d in detalles_usuarios:
            estado_perfil = "Maduro (Historial consolidado)" if d['tx_count'] >= 5 else (
                "En Observación (1 a 4 envíos)" if d['tx_count'] > 0 else "Nuevo / Sin Historial (Aplica Baseline S/ 80.00)"
            )
            print(f"\n👤 [CUENTA #{d['id']}] {d['name']} ({d['phone']}):")
            print(f"   • Estado del Perfil:       {estado_perfil}")
            print(f"   • Saldo en Billetera:      S/ {d['balance']:.2f}")
            print(f"   • Envíos Completados:      {d['tx_count']} operaciones registradas")
            print(f"   • Monto Promedio Habitual: S/ {d['avg_monto']:.2f}")
            print(f"   • Horario más Frecuente:   {d['common_hour']}")
            print(f"   • Ubicación Habitual:      {d['common_loc']}")
            print(f"   • Red de Confianza Social: {d['cf_count']} contactos vinculados en MySQL")
            print(f"   • Umbral de Alerta (>4.5x): S/ {d['avg_monto'] * 4.5:.2f} (Superar este monto disparará alerta de gasto inusual)")

        print("\n" + "="*88)
        print(" [OK] Reporte generado en tiempo real leyendo directamente desde MySQL.")
        print("="*88 + "\n")

    except Exception as e:
        print(f"\n[ERROR] No se pudo generar el reporte: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    mostrar_perfiles_bancarios()
