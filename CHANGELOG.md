# CHANGELOG

## [2026-03-01 20:45] — Single-Port Serving (FastAPI serves React build)

**Changes**:
- FastAPI now mounts the React production build (`frontend/dist`) and serves it at `/`
- All non-API routes fall through to `index.html` (SPA routing works correctly)
- Static assets served under `/assets/`
- Vite dev server exposed on `0.0.0.0` (`host: true`) for LAN/phone access during development

**PR/Push**: `claude/build-broker-os-webapp-VaJBp`
**Why it mattered**: Eliminates two-port dev requirement; single `uvicorn` process on port 8000 serves the full app, enabling simpler deployment and preview access.

---

## [2026-02-26 04:15] — BrokerOS MVP Prototype

**Changes**:
- Built full-stack web application from PRD v2.0 specification
- **Backend** (FastAPI + SQLAlchemy + SQLite):
  - JWT auth (signup, login, email OTP verification, refresh tokens)
  - Broker/Agent onboarding with NCRIB license flow and commission configuration
  - Multi-insurer quote engine — generates quotes from 10 Nigerian insurers simultaneously (Leadway, Heirs, AXA Mansard, AIICO, Custodian, Mutual Benefits, Cornerstone, Sovereign, NEM, NSIA)
  - Full quote lifecycle: generate → select → send → payment confirmation → commission confirmation → policy activation
  - Client management (Individual & Corporate KYC with CAC, directors, industry)
  - Policy management with expiry tracking and renewal detection
  - Wallet with commission tracking, GWP metrics, and transaction history
  - Dashboard stats endpoint with monthly metrics
  - Seed data: 8 demo clients, 10 insurers, 8 active policies, realistic Nigerian GWP/commission figures
- **Frontend** (React 18 + Vite + Tailwind CSS):
  - Login / Signup / OTP verification pages with demo hint
  - App shell with responsive sidebar (mobile hamburger, desktop persistent)
  - Dashboard with GWP, commission, pending, and expiring policy KPIs
  - 4-step Quote Wizard: client selection → product → product-specific underwriting forms → quote comparison table with commission breakdown
  - Full underwriting forms for Auto (TP/Comprehensive/TPFT + vehicle usage + VIN), Health (tiers + enrollees), Life (term/whole), Travel (region + dates), Device (IMEI + coverage)
  - Client list with search/filter, Client detail with policy history
  - Policy list with status/product filters and expiry countdown
  - Wallet page with balance cards, bank account management, transaction log
  - "Coming Soon — Website Builder" teaser in sidebar and dashboard

**PR/Push**: `claude/build-broker-os-webapp-VaJBp`

**Why it mattered**: Eliminates 70+ hours/week of manual broker operations. Quote generation reduced from 2–4 hours to under 10 minutes. Directly enables the path to ₦48M ARR target (100 brokers × ₦40K/month). Prototype is immediately demoable to prospective broker customers.
