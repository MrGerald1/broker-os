import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, Date, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quote_id = Column(String, ForeignKey("quotes.id"), nullable=True)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    broker_id = Column(String, ForeignKey("users.id"), nullable=False)
    agent_id = Column(String, ForeignKey("users.id"), nullable=True)
    insurer_id = Column(String, ForeignKey("insurers.id"), nullable=True)
    product_type = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    annual_premium = Column(Numeric(18, 2), nullable=False)
    commission_rate = Column(Numeric(6, 4), nullable=False)
    commission_amount = Column(Numeric(18, 2), nullable=False)
    net_remittance_to_insurer = Column(Numeric(18, 2), nullable=False)
    status = Column(
        SAEnum(
            "quote_pending", "payment_pending", "active", "expiring_soon",
            "expired", "cancelled", "claimed",
            name="policy_status_enum",
        ),
        default="payment_pending",
    )
    is_renewal = Column(Boolean, default=False)
    previous_policy_id = Column(String, ForeignKey("policies.id"), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    policy_certificate_url = Column(String, nullable=True)
    insurer_policy_reference = Column(String, nullable=True)
    niid_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)

    client = relationship("Client", back_populates="policies")
    quote = relationship("Quote", back_populates="policy", foreign_keys=[quote_id])
    insurer = relationship("Insurer")
    transaction = relationship("Transaction", back_populates="policy", uselist=False)
