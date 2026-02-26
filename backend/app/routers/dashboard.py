from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.database import get_db
from app.models.user import User
from app.models.client import Client
from app.models.policy import Policy
from app.models.quote import Quote
from app.models.transaction import Transaction
from app.routers.deps import require_active

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_active),
):
    today = date.today()
    month_start = datetime(today.year, today.month, 1)

    total_clients = db.query(Client).filter(Client.broker_id == current_user.id).count()
    total_policies = db.query(Policy).filter(Policy.broker_id == current_user.id, Policy.status == "active").count()
    total_quotes = db.query(Quote).filter(Quote.created_by_user_id == current_user.id).count()

    quotes_this_month = (
        db.query(Quote)
        .filter(
            Quote.created_by_user_id == current_user.id,
            Quote.created_at >= month_start,
        )
        .count()
    )

    confirmed_tx = (
        db.query(Transaction)
        .filter(
            Transaction.broker_id == current_user.id,
            Transaction.status.in_(["confirmed", "remitted"]),
            Transaction.confirmed_at >= month_start,
        )
        .all()
    )

    gwp_this_month = sum(float(t.premium_amount) for t in confirmed_tx)
    commission_this_month = sum(float(t.commission_amount) for t in confirmed_tx)

    pending_tx = (
        db.query(Transaction)
        .filter(
            Transaction.broker_id == current_user.id,
            Transaction.status == "awaiting_confirmation",
        )
        .all()
    )
    pending_commission = sum(float(t.commission_amount) for t in pending_tx)

    # Expiring soon
    from datetime import timedelta
    in_30 = today + timedelta(days=30)
    expiring_count = (
        db.query(Policy)
        .filter(
            Policy.broker_id == current_user.id,
            Policy.status == "active",
            Policy.end_date <= in_30,
            Policy.end_date >= today,
        )
        .count()
    )

    # Recent quotes
    recent_quotes = (
        db.query(Quote)
        .filter(Quote.created_by_user_id == current_user.id)
        .order_by(Quote.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_clients": total_clients,
        "total_active_policies": total_policies,
        "total_quotes": total_quotes,
        "quotes_this_month": quotes_this_month,
        "gwp_this_month": gwp_this_month,
        "commission_this_month": commission_this_month,
        "pending_commission": pending_commission,
        "expiring_soon_count": expiring_count,
        "recent_quotes": [
            {
                "id": q.id,
                "product_type": q.product_type,
                "status": q.status,
                "created_at": str(q.created_at),
            }
            for q in recent_quotes
        ],
    }
