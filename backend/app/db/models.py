from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
)

from app.db.connection import Base


class Organ(Base):
    __tablename__ = "organs"

    id = Column(Integer, primary_key=True, index=True)
    organ_type = Column(String(50), nullable=False)
    blood_group = Column(String(5), nullable=False)
    donor_id = Column(String(50), nullable=False)
    hospital_id = Column(Integer, nullable=False)
    status = Column(String(30), default="available")
    created_at = Column(DateTime, default=datetime.utcnow)


class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    organ_type = Column(String(50), nullable=False)
    blood_group = Column(String(5), nullable=False)
    urgency_level = Column(Integer, nullable=False)
    pra_percentage = Column(Float, default=0.0)
    hospital_id = Column(Integer, nullable=False)
    status = Column(String(30), default="waiting")
    created_at = Column(DateTime, default=datetime.utcnow)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String(20), nullable=True)


class Transport(Base):
    __tablename__ = "transports"

    id = Column(Integer, primary_key=True, index=True)
    organ_id = Column(Integer, nullable=False)
    source_hospital_id = Column(Integer, nullable=False)
    destination_hospital_id = Column(Integer, nullable=False)
    route = Column(Text, nullable=True)
    distance_km = Column(Float, nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    status = Column(String(30), default="planned")
    created_at = Column(DateTime, default=datetime.utcnow)


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    organ_id = Column(Integer, nullable=False)
    recipient_id = Column(Integer, nullable=False)
    blood_group_match = Column(String(20), nullable=False)
    pra_score = Column(Float, nullable=False)
    compatibility_score = Column(Float, nullable=False)
    decision = Column(String(30), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    actor = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    transaction_hash = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)