import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    broker_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    available_balance = Column(Numeric(18, 2), default=0)
    pending_balance = Column(Numeric(18, 2), default=0)
    total_gwp_all_time = Column(Numeric(18, 2), default=0)
    total_commissions_all_time = Column(Numeric(18, 2), default=0)
    bank_accounts = Column(JSON, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    broker = relationship("User", back_populates="wallet")
