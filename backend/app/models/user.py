import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    account_type = Column(SAEnum("broker", "agent", name="account_type_enum"), nullable=False)
    business_name = Column(String, nullable=True)
    ncrib_license_number = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    phone = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    business_address = Column(String, nullable=True)
    cac_number = Column(String, nullable=True)
    role = Column(SAEnum("admin", "agent", "operations", name="role_enum"), default="admin")
    status = Column(
        SAEnum("pending_verification", "active", "suspended", name="user_status_enum"),
        default="pending_verification",
    )
    commission_type = Column(
        SAEnum("custom", "flat_4_percent", name="commission_type_enum"),
        nullable=False,
    )
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(String, default="0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    clients = relationship("Client", back_populates="broker", foreign_keys="Client.broker_id")
    wallet = relationship("Wallet", back_populates="broker", uselist=False)
    notifications = relationship("Notification", back_populates="user")
