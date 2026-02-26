from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.quote import Quote
from app.models.client import Client
from app.models.user import User
from app.models.policy import Policy
from app.models.transaction import Transaction
from app.models.wallet import Wallet
from app.services.quote_engine import generate_quotes
from app.routers.deps import require_active

router = APIRouter(prefix="/quotes", tags=["quotes"])


class QuoteRequest(BaseModel):
    client_id: str
    product_type: str
    coverage_type: Optional[str] = None
    vehicle_usage: Optional[str] = None
    product_details: dict = {}
    is_renewal: bool = False
    previous_policy_id: Optional[str] = None


class SelectQuoteRequest(BaseModel):
    insurer_id: str
    quote_index: int


@router.get("")
def list_quotes(
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    q = db.query(Quote).filter(Quote.created_by_user_id == current_user.id)
    if status:
        q = q.filter(Quote.status == status)
    total = q.count()
    quotes = q.order_by(Quote.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [_quote_dict(q, db) for q in quotes],
    }


@router.post("", status_code=201)
def create_quote(
    payload: QuoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    client = db.query(Client).filter(
        Client.id == payload.client_id, Client.broker_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Generate quotes via mock engine
    quotes_returned = generate_quotes(
        db=db,
        broker_id=current_user.id,
        product_type=payload.product_type,
        product_details=payload.product_details,
        coverage_type=payload.coverage_type,
    )

    quote = Quote(
        client_id=payload.client_id,
        created_by_user_id=current_user.id,
        product_type=payload.product_type,
        coverage_type=payload.coverage_type,
        vehicle_usage=payload.vehicle_usage,
        is_renewal=payload.is_renewal,
        previous_policy_id=payload.previous_policy_id,
        product_details=payload.product_details,
        quotes_returned=quotes_returned,
        status="draft",
        payment_link_expires_at=datetime.utcnow() + timedelta(days=30),
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return _quote_dict(quote, db)


@router.get("/{quote_id}")
def get_quote(
    quote_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return _quote_dict(quote, db)


@router.post("/{quote_id}/select")
def select_quote(
    quote_id: str,
    payload: SelectQuoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    """Select an insurer from quote results and mark quote as sent."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    quotes_returned = quote.quotes_returned or []
    if payload.quote_index >= len(quotes_returned):
        raise HTTPException(status_code=400, detail="Invalid quote index")

    selected = quotes_returned[payload.quote_index]
    quote.selected_insurer_id = payload.insurer_id
    quote.selected_quote_index = str(payload.quote_index)
    quote.status = "sent"
    quote.sent_at = datetime.utcnow()
    quote.payment_link = f"https://paystack.com/pay/mock-{quote_id[:8]}"
    db.commit()

    return {
        "message": "Quote sent to client. Payment link generated.",
        "payment_link": quote.payment_link,
        "selected_quote": selected,
    }


@router.post("/{quote_id}/confirm-payment")
def confirm_payment_mock(
    quote_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    """Mock payment confirmation (simulates Paystack webhook)."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    if quote.status not in ("sent", "draft"):
        raise HTTPException(status_code=400, detail="Quote cannot be paid in current status")

    quotes_returned = quote.quotes_returned or []
    selected_idx = int(quote.selected_quote_index or 0)
    selected = quotes_returned[selected_idx] if quotes_returned else {}

    premium = selected.get("annual_premium", 0)
    commission_rate = selected.get("commission_rate", 0.15)
    commission_amount = selected.get("commission_amount", 0)
    net_remittance = premium - commission_amount

    from datetime import date
    policy = Policy(
        quote_id=quote_id,
        client_id=quote.client_id,
        broker_id=current_user.id,
        insurer_id=selected.get("insurer_id"),
        product_type=quote.product_type,
        plan_name=selected.get("plan_name", "Insurance Policy"),
        annual_premium=premium,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        net_remittance_to_insurer=net_remittance,
        status="payment_pending",
        is_renewal=quote.is_renewal,
        start_date=date.today(),
        end_date=date.today().replace(year=date.today().year + 1),
    )
    db.add(policy)
    db.flush()

    transaction = Transaction(
        policy_id=policy.id,
        client_id=quote.client_id,
        broker_id=current_user.id,
        paystack_reference=f"mock_ref_{quote_id[:8]}",
        premium_amount=premium,
        commission_rate=commission_rate,
        commission_amount=commission_amount,
        net_remittance=net_remittance,
        payment_channel="card",
        status="awaiting_confirmation",
    )
    db.add(transaction)

    quote.status = "paid"
    db.commit()

    return {
        "message": "Payment received. Please confirm your commission to activate the policy.",
        "policy_id": policy.id,
        "transaction_id": transaction.id,
        "commission_amount": commission_amount,
        "requires_confirmation": True,
    }


@router.post("/{quote_id}/confirm-commission")
def confirm_commission(
    quote_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    """Broker confirms commission — triggers policy activation."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    policy = db.query(Policy).filter(Policy.quote_id == quote_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    transaction = db.query(Transaction).filter(Transaction.policy_id == policy.id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    transaction.status = "confirmed"
    transaction.confirmed_at = datetime.utcnow()
    transaction.confirmed_by_user_id = current_user.id

    policy.status = "active"
    policy.activated_at = datetime.utcnow()

    # Credit wallet
    wallet = db.query(Wallet).filter(Wallet.broker_id == current_user.id).first()
    if wallet:
        wallet.available_balance = float(wallet.available_balance or 0) + float(transaction.commission_amount)
        wallet.total_gwp_all_time = float(wallet.total_gwp_all_time or 0) + float(transaction.premium_amount)
        wallet.total_commissions_all_time = (
            float(wallet.total_commissions_all_time or 0) + float(transaction.commission_amount)
        )

    db.commit()
    return {
        "message": "Commission confirmed. Policy is now active.",
        "policy_status": "active",
        "commission_credited": float(transaction.commission_amount),
    }


def _quote_dict(q: Quote, db: Session) -> dict:
    client = db.query(Client).filter(Client.id == q.client_id).first()
    return {
        "id": q.id,
        "client_id": q.client_id,
        "client_name": client.full_name if client else None,
        "product_type": q.product_type,
        "coverage_type": q.coverage_type,
        "vehicle_usage": q.vehicle_usage,
        "is_renewal": q.is_renewal,
        "product_details": q.product_details,
        "quotes_returned": q.quotes_returned,
        "selected_insurer_id": q.selected_insurer_id,
        "selected_quote_index": q.selected_quote_index,
        "status": q.status,
        "payment_link": q.payment_link,
        "sent_at": str(q.sent_at) if q.sent_at else None,
        "created_at": str(q.created_at),
    }
