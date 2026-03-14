# BrokerOS — Nigerian Insurance Broker Operations Platform

AI-powered platform that reduces broker operational time from 70+ hours/week to under 10 hours, enabling 3× more quotes without hiring additional staff.

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
python3 -m app.seed        # seed demo data
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — Demo login: `demo@brokeross.ng` / `demo1234`

API docs: **http://localhost:8000/docs**

## Features (MVP)

| Feature | Status |
|---------|--------|
| Broker & Agent Onboarding (NCRIB verification, email OTP) | ✅ |
| AI Multi-Insurer Quote Generator (Auto, Health, Life, Travel, Device) | ✅ |
| Quote → Payment → Policy lifecycle | ✅ |
| Client Management (Individual & Corporate KYC) | ✅ |
| Policy Management with renewal tracking | ✅ |
| Wallet, Commission Confirmation & Transactions | ✅ |
| 10 Insurers seeded (Leadway, Heirs, AXA Mansard, AIICO…) | ✅ |
| Mobile-responsive UI | ✅ |
| JWT auth with refresh tokens | ✅ |
| Website Builder (Coming Soon teaser) | ✅ |

## Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Auth**: HMAC-SHA256 JWT (no cffi dependency)
- **Payments**: Paystack (mock/test mode — set `PAYSTACK_SECRET_KEY`)
- **Email**: SendGrid (mock/test mode — set `SENDGRID_API_KEY`)

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
DATABASE_URL=sqlite:///./brokeross.db
SECRET_KEY=your-256-bit-random-key
PAYSTACK_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....
```

## API Endpoints

```
POST /api/v1/auth/signup           — Create broker/agent account
POST /api/v1/auth/login            — Login
POST /api/v1/auth/verify-otp       — Email OTP verification

GET  /api/v1/dashboard/stats       — Dashboard metrics
GET  /api/v1/clients               — List clients (with search)
POST /api/v1/clients               — Create client
GET  /api/v1/quotes                — List quotes
POST /api/v1/quotes                — Generate multi-insurer quotes
POST /api/v1/quotes/{id}/select    — Select insurer & send to client
POST /api/v1/quotes/{id}/confirm-payment    — Mock Paystack webhook
POST /api/v1/quotes/{id}/confirm-commission — Confirm commission & activate policy
GET  /api/v1/policies              — List policies
GET  /api/v1/wallet                — Wallet balance & metrics
GET  /api/v1/wallet/transactions   — Transaction history
GET  /api/v1/insurers              — List insurers
```
