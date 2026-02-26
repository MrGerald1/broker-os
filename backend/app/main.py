from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.models import (  # noqa: F401 — ensure models are loaded before create_all
    User, Client, Insurer, InsurancePlan, CommissionRate,
    Quote, Policy, Transaction, Wallet, Notification, Document, ActivityLog,
)
from app.routers import auth, clients, quotes, policies, wallet, dashboard, insurers

settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BrokerOS API",
    description="AI-powered insurance broker operations platform for Nigerian SME brokers",
    version="1.0.0",
)

# CORS: allow the configured frontend URL; in dev also allow localhost fallbacks
_cors_origins = list({settings.frontend_url, "http://localhost:5173", "http://localhost:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(quotes.router, prefix="/api/v1")
app.include_router(policies.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(insurers.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BrokerOS API v1.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
