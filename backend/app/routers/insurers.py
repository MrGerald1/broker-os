from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.insurer import Insurer
from app.models.commission_rate import CommissionRate
from app.models.user import User
from app.routers.deps import require_active
from pydantic import BaseModel

router = APIRouter(prefix="/insurers", tags=["insurers"])


class CommissionRateSet(BaseModel):
    insurer_id: str
    product_type: str
    commission_rate: float


@router.get("")
def list_insurers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    insurers = db.query(Insurer).filter(Insurer.status == "active").all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "short_name": i.short_name,
            "api_integrated": i.api_integrated,
            "products_offered": i.products_offered,
            "contact_email": i.contact_email,
        }
        for i in insurers
    ]


@router.get("/commission-rates")
def get_commission_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    rates = db.query(CommissionRate).filter(CommissionRate.broker_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "insurer_id": r.insurer_id,
            "product_type": r.product_type,
            "commission_rate": float(r.commission_rate),
        }
        for r in rates
    ]


@router.post("/commission-rates")
def set_commission_rate(
    payload: CommissionRateSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    existing = (
        db.query(CommissionRate)
        .filter(
            CommissionRate.broker_id == current_user.id,
            CommissionRate.insurer_id == payload.insurer_id,
            CommissionRate.product_type == payload.product_type,
        )
        .first()
    )
    if existing:
        existing.commission_rate = payload.commission_rate
    else:
        rate = CommissionRate(
            broker_id=current_user.id,
            insurer_id=payload.insurer_id,
            product_type=payload.product_type,
            commission_rate=payload.commission_rate,
        )
        db.add(rate)
    db.commit()
    return {"message": "Commission rate saved"}
