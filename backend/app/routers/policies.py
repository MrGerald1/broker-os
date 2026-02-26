from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.models.policy import Policy
from app.models.client import Client
from app.models.insurer import Insurer
from app.models.user import User
from app.routers.deps import require_active

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("")
def list_policies(
    status: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    q = db.query(Policy).filter(Policy.broker_id == current_user.id)
    if status:
        q = q.filter(Policy.status == status)
    if product_type:
        q = q.filter(Policy.product_type == product_type)
    total = q.count()
    policies = q.order_by(Policy.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [_policy_dict(p, db) for p in policies],
    }


@router.get("/expiring")
def get_expiring_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    """Policies expiring within 30 days."""
    from datetime import timedelta
    today = date.today()
    in_30 = today + timedelta(days=30)
    policies = (
        db.query(Policy)
        .filter(
            Policy.broker_id == current_user.id,
            Policy.status == "active",
            Policy.end_date <= in_30,
            Policy.end_date >= today,
        )
        .all()
    )
    return [_policy_dict(p, db) for p in policies]


@router.get("/{policy_id}")
def get_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    policy = db.query(Policy).filter(
        Policy.id == policy_id, Policy.broker_id == current_user.id
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _policy_dict(policy, db)


def _policy_dict(p: Policy, db: Session) -> dict:
    client = db.query(Client).filter(Client.id == p.client_id).first()
    insurer = db.query(Insurer).filter(Insurer.id == p.insurer_id).first() if p.insurer_id else None
    return {
        "id": p.id,
        "client_id": p.client_id,
        "client_name": client.full_name if client else None,
        "product_type": p.product_type,
        "plan_name": p.plan_name,
        "insurer_name": insurer.name if insurer else None,
        "annual_premium": float(p.annual_premium),
        "commission_rate": float(p.commission_rate),
        "commission_amount": float(p.commission_amount),
        "net_remittance_to_insurer": float(p.net_remittance_to_insurer),
        "status": p.status,
        "is_renewal": p.is_renewal,
        "start_date": str(p.start_date) if p.start_date else None,
        "end_date": str(p.end_date) if p.end_date else None,
        "insurer_policy_reference": p.insurer_policy_reference,
        "created_at": str(p.created_at),
        "activated_at": str(p.activated_at) if p.activated_at else None,
    }
