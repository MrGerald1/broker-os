import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, JSON, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class InsurancePlan(Base):
    __tablename__ = "insurance_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    insurer_id = Column(String, ForeignKey("insurers.id"), nullable=False)
    product_type = Column(
        SAEnum("auto", "health", "life", "travel", "device", name="product_type_enum"),
        nullable=False,
    )
    plan_name = Column(String, nullable=False)
    plan_tier = Column(String, nullable=True)
    vehicle_usage_type = Column(String, nullable=True)
    coverage_limit = Column(Numeric(18, 2), nullable=True)
    premium_type = Column(
        SAEnum("fixed", "range", "dynamic_api", "percentage_of_value", name="premium_type_enum"),
        nullable=False,
    )
    premium_fixed = Column(Numeric(18, 2), nullable=True)
    premium_range_min = Column(Numeric(18, 2), nullable=True)
    premium_range_max = Column(Numeric(18, 2), nullable=True)
    premium_rate_percent = Column(Numeric(6, 4), nullable=True)
    benefits = Column(JSON, default=list)
    exclusions = Column(JSON, default=list)
    excess_amount = Column(Numeric(18, 2), nullable=True)
    policy_wording_url = Column(String, nullable=True)
    status = Column(SAEnum("active", "inactive", name="plan_status_enum"), default="active")
    source = Column(
        SAEnum("api", "manual", "scraped", name="plan_source_enum"),
        default="manual",
    )
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    insurer = relationship("Insurer", back_populates="plans")
