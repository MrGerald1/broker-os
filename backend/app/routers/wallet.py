from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.models.policy import Policy
from app.models.client import Client
from app.models.user import User
from app.routers.deps import require_active

router = APIRouter(prefix="/wallet", tags=["wallet"])


class BankAccountPayload(BaseModel):
    bank_name: str
    account_number: str
    account_name: str
    is_default: bool = True


@router.get("")
def get_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    wallet = db.query(Wallet).filter(Wallet.broker_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(broker_id=current_user.id)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    # GWP this month
    from datetime import date
    today = date.today()
    month_start = today.replace(day=1)

    transactions_this_month = (
        db.query(Transaction)
        .filter(
            Transaction.broker_id == current_user.id,
            Transaction.status.in_(["confirmed", "remitted"]),
            Transaction.confirmed_at >= datetime(today.year, today.month, 1),
        )
        .all()
    )

    gwp_this_month = sum(float(t.premium_amount) for t in transactions_this_month)
    commission_this_month = sum(float(t.commission_amount) for t in transactions_this_month)

    pending_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.broker_id == current_user.id,
            Transaction.status == "awaiting_confirmation",
        )
        .all()
    )
    pending_commission = sum(float(t.commission_amount) for t in pending_transactions)

    return {
        "available_balance": float(wallet.available_balance or 0),
        "pending_balance": pending_commission,
        "total_gwp_all_time": float(wallet.total_gwp_all_time or 0),
        "total_commissions_all_time": float(wallet.total_commissions_all_time or 0),
        "gwp_this_month": gwp_this_month,
        "commission_this_month": commission_this_month,
        "bank_accounts": wallet.bank_accounts or [],
    }


@router.get("/transactions")
def list_transactions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.broker_id == current_user.id)
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_tx_dict(t, db) for t in transactions]


@router.get("/pending-confirmations")
def pending_confirmations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.broker_id == current_user.id,
            Transaction.status == "awaiting_confirmation",
        )
        .all()
    )
    return [_tx_dict(t, db) for t in transactions]


@router.post("/bank-account")
def add_bank_account(
    payload: BankAccountPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    wallet = db.query(Wallet).filter(Wallet.broker_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    accounts = list(wallet.bank_accounts or [])
    if payload.is_default:
        for acc in accounts:
            acc["is_default"] = False
    accounts.append(payload.model_dump())
    wallet.bank_accounts = accounts
    db.commit()
    return {"message": "Bank account added", "bank_accounts": accounts}


def _tx_dict(t: Transaction, db: Session) -> dict:
    client = db.query(Client).filter(Client.id == t.client_id).first()
    policy = db.query(Policy).filter(Policy.id == t.policy_id).first()
    return {
        "id": t.id,
        "client_name": client.full_name if client else None,
        "product_type": policy.product_type if policy else None,
        "plan_name": policy.plan_name if policy else None,
        "premium_amount": float(t.premium_amount),
        "commission_rate": float(t.commission_rate),
        "commission_amount": float(t.commission_amount),
        "net_remittance": float(t.net_remittance),
        "payment_channel": t.payment_channel,
        "status": t.status,
        "confirmed_at": str(t.confirmed_at) if t.confirmed_at else None,
        "created_at": str(t.created_at),
    }
