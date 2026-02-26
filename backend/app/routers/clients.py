from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date

from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.routers.deps import require_active

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientCreate(BaseModel):
    type: str
    full_name: str
    phone: str
    email: str
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    company_name: Optional[str] = None
    cac_number: Optional[str] = None
    industry_sector: Optional[str] = None
    employee_count: Optional[int] = None
    contact_person_name: Optional[str] = None
    contact_person_designation: Optional[str] = None
    directors: Optional[list] = []


class ClientUpdate(ClientCreate):
    pass


@router.get("")
def list_clients(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    q = db.query(Client).filter(Client.broker_id == current_user.id)
    if search:
        q = q.filter(
            Client.full_name.ilike(f"%{search}%")
            | Client.email.ilike(f"%{search}%")
            | Client.phone.ilike(f"%{search}%")
        )
    if type:
        q = q.filter(Client.type == type)
    total = q.count()
    clients = q.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [_client_dict(c) for c in clients],
    }


@router.post("", status_code=201)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    client = Client(
        broker_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return _client_dict(client)


@router.get("/{client_id}")
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    client = db.query(Client).filter(
        Client.id == client_id, Client.broker_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return _client_dict(client)


@router.put("/{client_id}")
def update_client(
    client_id: str,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    client = db.query(Client).filter(
        Client.id == client_id, Client.broker_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(client, k, v)
    db.commit()
    db.refresh(client)
    return _client_dict(client)


@router.get("/{client_id}/policies")
def get_client_policies(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    from app.models.policy import Policy
    client = db.query(Client).filter(
        Client.id == client_id, Client.broker_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    policies = db.query(Policy).filter(Policy.client_id == client_id).all()
    return [_policy_dict(p) for p in policies]


def _client_dict(c: Client) -> dict:
    return {
        "id": c.id,
        "type": c.type,
        "full_name": c.full_name,
        "phone": c.phone,
        "email": c.email,
        "date_of_birth": str(c.date_of_birth) if c.date_of_birth else None,
        "address": c.address,
        "company_name": c.company_name,
        "cac_number": c.cac_number,
        "industry_sector": c.industry_sector,
        "employee_count": c.employee_count,
        "directors": c.directors,
        "created_at": str(c.created_at),
    }


def _policy_dict(p) -> dict:
    return {
        "id": p.id,
        "product_type": p.product_type,
        "plan_name": p.plan_name,
        "annual_premium": float(p.annual_premium),
        "status": p.status,
        "start_date": str(p.start_date) if p.start_date else None,
        "end_date": str(p.end_date) if p.end_date else None,
    }
