import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey
from app.database import Base


class CommissionRate(Base):
    __tablename__ = "commission_rates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    broker_id = Column(String, ForeignKey("users.id"), nullable=False)
    insurer_id = Column(String, ForeignKey("insurers.id"), nullable=False)
    product_type = Column(String, nullable=False)
    commission_rate = Column(Numeric(6, 4), nullable=False)
    verified = Column(Boolean, default=False)
    verification_evidence_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
