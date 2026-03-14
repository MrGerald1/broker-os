import uuid
from sqlalchemy import Column, String, Boolean, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class Insurer(Base):
    __tablename__ = "insurers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    api_integrated = Column(Boolean, default=False)
    api_base_url = Column(String, nullable=True)
    api_auth_method = Column(String, nullable=True)
    api_quote_endpoint = Column(String, nullable=True)
    api_policy_endpoint = Column(String, nullable=True)
    settlement_account_name = Column(String, nullable=True)
    settlement_bank = Column(String, nullable=True)
    settlement_account_number = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    status = Column(SAEnum("active", "inactive", name="insurer_status_enum"), default="active")
    products_offered = Column(JSON, default=list)

    plans = relationship("InsurancePlan", back_populates="insurer")
