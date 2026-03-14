import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    broker_id = Column(String, ForeignKey("users.id"), nullable=False)
    paystack_reference = Column(String, nullable=True)
    paystack_charge_id = Column(String, nullable=True)
    premium_amount = Column(Numeric(18, 2), nullable=False)
    commission_rate = Column(Numeric(6, 4), nullable=False)
    commission_amount = Column(Numeric(18, 2), nullable=False)
    net_remittance = Column(Numeric(18, 2), nullable=False)
    payment_channel = Column(String, nullable=True)
    status = Column(
        SAEnum(
            "awaiting_confirmation", "confirmed", "remitted", "disputed",
            name="transaction_status_enum",
        ),
        default="awaiting_confirmation",
    )
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_by_user_id = Column(String, nullable=True)
    remitted_at = Column(DateTime, nullable=True)
    paystack_transfer_id = Column(String, nullable=True)
    dispute_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    policy = relationship("Policy", back_populates="transaction")
