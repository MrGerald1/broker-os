import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    broker_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_agent_id = Column(String, ForeignKey("users.id"), nullable=True)
    type = Column(SAEnum("individual", "corporate", name="client_type_enum"), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    id_type = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    # Corporate fields
    company_name = Column(String, nullable=True)
    cac_number = Column(String, nullable=True)
    industry_sector = Column(String, nullable=True)
    employee_count = Column(Integer, nullable=True)
    contact_person_name = Column(String, nullable=True)
    contact_person_designation = Column(String, nullable=True)
    directors = Column(JSON, default=list)
    source = Column(
        SAEnum("manual", "import", "quote_creation", name="client_source_enum"),
        default="manual",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    broker = relationship("User", back_populates="clients", foreign_keys=[broker_id])
    policies = relationship("Policy", back_populates="client")
    quotes = relationship("Quote", back_populates="client")
