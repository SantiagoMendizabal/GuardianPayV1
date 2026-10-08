from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dni = Column(String(8), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    phone = Column(String(9), unique=True, index=True, nullable=False)
    birth_date = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    pin = Column(String(128), nullable=False, default="123456")
    balance = Column(Float, nullable=False, default=1500.0)
    account_number = Column(String(30), unique=True, nullable=False)
    avatar = Column(String(4), default="AL")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones de transacciones
    sent_transactions = relationship("Transaction", back_populates="sender", foreign_keys="Transaction.sender_id")
    received_transactions = relationship("Transaction", back_populates="receiver", foreign_keys="Transaction.receiver_id")
    frequent_contacts = relationship("ContactoFrecuente", back_populates="user", foreign_keys="ContactoFrecuente.user_id")

    def to_dict(self):
        return {
            "id": self.id,
            "dni": self.dni,
            "name": self.name,
            "phone": self.phone,
            "birth_date": self.birth_date,
            "email": self.email,
            "balance": round(self.balance, 2),
            "accountNumber": self.account_number,
            "avatar": self.avatar
        }

# Alias en español para el modelo
Usuario = User


class Transaction(Base):
    __tablename__ = "transferencias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    operation_code = Column(String(40), unique=True, index=True, nullable=False)
    sender_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    amount = Column(Float, nullable=False)
    time_str = Column(String(20), nullable=False)
    location_str = Column(String(60), default="Arequipa")
    is_frequent_contact = Column(Boolean, default=True)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    decision = Column(String(40), nullable=False)
    status = Column(String(20), default="COMPLETADO")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_transactions")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_transactions")

    def to_dict(self, current_user_id=None):
        is_sender = (self.sender_id == current_user_id) if current_user_id else True
        counterpart = self.receiver if is_sender else self.sender
        amount_sign = -self.amount if is_sender else self.amount

        return {
            "id": f"tx-{self.id}",
            "operationCode": self.operation_code,
            "amount": amount_sign,
            "title": f"Transferencia a {counterpart.name if counterpart else 'Destinatario'}" if is_sender else f"Transferencia de {counterpart.name if counterpart else 'Emisor'}",
            "category": "Transferencia",
            "recipient": counterpart.name if counterpart else "Destinatario",
            "recipientPhone": counterpart.phone if counterpart else "",
            "date": f"Hoy, {self.time_str.replace(' AM', '').replace(' PM', '')}",
            "riskScore": self.risk_score,
            "riskLevel": self.risk_level,
            "status": self.status.lower(),
            "type": "egreso" if is_sender else "ingreso"
        }

# Alias en español
Transferencia = Transaction


class AuditoriaIA(Base):
    __tablename__ = "auditoria_ia"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    operation_code = Column(String(40), nullable=True)
    monto_evaluado = Column(Float, nullable=False)
    hora_transaccion = Column(String(20), nullable=False)
    es_madrugada = Column(Integer, default=0)
    es_contacto_nuevo = Column(Integer, default=0)
    es_ubicacion_inusual = Column(Integer, default=0)
    score_obtenido = Column(Float, nullable=False)
    nivel_riesgo = Column(String(20), nullable=False)
    decision_ia = Column(String(40), nullable=False)
    tiempo_inferencia_ms = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "operationCode": self.operation_code,
            "monto": self.monto_evaluado,
            "hora": self.hora_transaccion,
            "score": self.score_obtenido,
            "nivelRiesgo": self.nivel_riesgo,
            "decision": self.decision_ia,
            "tiempoMs": self.tiempo_inferencia_ms,
            "createdAt": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }


class ContactoFrecuente(Base):
    __tablename__ = "contactos_frecuentes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    contact_user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    alias = Column(String(80), nullable=True)
    contador_transferencias = Column(Integer, default=1)
    es_favorito = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="frequent_contacts")
    contact = relationship("User", foreign_keys=[contact_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "contactUserId": self.contact_user_id,
            "name": self.alias or (self.contact.name if self.contact else "Contacto"),
            "phone": self.contact.phone if self.contact else "",
            "transfersCount": self.contador_transferencias,
            "isFavorite": self.es_favorito,
            "avatar": self.contact.avatar if self.contact else "CO"
        }
