import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=True)
    broker_id = Column(String, ForeignKey("users.id"), nullable=False)
    policy_id = Column(String, ForeignKey("policies.id"), nullable=True)
    type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    ocr_extracted_data = Column(JSON, nullable=True)
    uploaded_by_user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
