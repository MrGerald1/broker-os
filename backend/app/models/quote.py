import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    product_type = Column(
        SAEnum("auto", "health", "life", "travel", "device", name="quote_product_enum"),
        nullable=False,
    )
    coverage_type = Column(String, nullable=True)
    vehicle_usage = Column(String, nullable=True)
    is_renewal = Column(Boolean, default=False)
    previous_policy_id = Column(String, ForeignKey("policies.id"), nullable=True)
    product_details = Column(JSON, default=dict)
    quotes_returned = Column(JSON, default=list)
    selected_insurer_id = Column(String, nullable=True)
    selected_quote_index = Column(String, nullable=True)
    status = Column(
        SAEnum("draft", "sent", "paid", "expired", "cancelled", name="quote_status_enum"),
        default="draft",
    )
    quote_pdf_url = Column(String, nullable=True)
    payment_link = Column(String, nullable=True)
    payment_link_expires_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="quotes")
    policy = relationship("Policy", back_populates="quote", foreign_keys="Policy.quote_id", uselist=False)
