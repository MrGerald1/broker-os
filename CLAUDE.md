# CLAUDE.md — Broker OS

This file governs how Claude Code operates in this repository. Follow every rule here without exception.

---

## 1. Workflow: EXPLORE → PLAN → CODE → TEST → COMMIT

Every task, no matter how small, must move through each stage in order. Never skip.

### EXPLORE
- If ≥50% of the task is ambiguous (unclear requirements, edge cases, missing business logic), use the `AskUserQuestion` tool **first** before doing anything else.
- Examples of when to ask:
  - "Clarify: what is the target outcome for this feature?"
  - "Clarify: should this action trigger a downstream flow or just a status update?"
- **Never assume.** Surface ambiguity early. One wrong assumption in core data or billing logic can cause compliance or financial risk.

### PLAN
- Outline: feature specs, API endpoints, DB schema changes, auth/security implications, deployment notes, and test strategy.
- Use a **MECE breakdown** (Mutually Exclusive, Collectively Exhaustive) — no overlap, no gaps.
- **Always explicitly ask**: "Do you want a full working implementation or a prototype?" before writing code.
- Confirm the plan with the user before proceeding to CODE.
- Before committing to any plan, run an internal **PRO vs AGAINST opinionated agent debate (minimum 10 rounds)**:
  - The AGAINST agent raises clear objections (complexity, security, performance, UX, regulatory risk).
  - The PRO agent must address each objection satisfactorily before AGAINST concedes.
  - Only move to CODE when AGAINST is clearly satisfied. Document the key debate outcomes in the plan.

### CODE
- Implement **one feature at a time**. Never bundle unrelated changes.
- **Tech stack is open and can grow**, but every addition must be explicitly justified. See Section 3.
- Prioritize: secure > correct > maintainable > fast.
- ⚠️ **Risk flag**: Any change to a critical path (core APIs, auth flows, payment logic, data migrations, shared infra) must include an explicit warning and user confirmation before implementation. See Section 3 for what qualifies as critical.

### TEST
- Write E2E tests using **pytest** (backend) and **pytest-playwright** (UI flows).
- Unit tests for all business logic (pricing engines, state machines, calculations, integrations, etc.).
- **100% of tests must pass before committing.** No exceptions. No "I'll fix it later."
- Fix all failures before moving on. If a test reveals a design flaw, revisit PLAN.

### COMMIT
- After every completed feature, update `CHANGELOG.md` with:
  - Timestamp (e.g., `2026-02-26 03:41`)
  - What changed
  - New pushes/PRs
  - **Why it mattered** — always tie to a business outcome
  - Example: `2026-02-26 03:41: Payments API — Unblocks checkout flow, directly enables revenue collection`
- Do **not** start the next feature until the current one is committed, tested, and logged.

---

## 2. Business Context & Key Metrics

Business goals are not background — they drive every technical decision. **Metrics here are context-dependent and must be updated to reflect the current project phase and priorities.**

> ⚠️ Before starting any feature, confirm the active metrics with the user if they are not already documented below. Do not invent targets.

| Metric | Target |
|--------|--------|
| _(add metrics here)_ | _(add targets here)_ |

Every feature should be evaluated against: **"Does this move us toward these targets?"**

Before any refactor (especially repeated ones marked with `#`), ask: **"What is the impact on the goal?"** If the answer is unclear or negative, pause and escalate.

---

## 3. Standards & Guardrails

### Tech Stack

The stack is **not fixed** — it can grow as the product demands. However:

- Every new language, framework, or service must be **explicitly justified** before adoption, covering:
  1. **What problem it solves** that existing stack components cannot.
  2. **Why this specific tool** over alternatives.
  3. **Operational cost**: added complexity, new failure modes, maintenance burden.
  4. **No bloat rule**: if it doesn't meaningfully earn its weight, don't add it.

- Current baseline (adjust as the project evolves):
  - **Backend**: FastAPI (async performance, auto OpenAPI docs)
  - **Frontend**: React + Vite (fast HMR, lean production builds)
  - **Data layer**: PostgreSQL + SQLAlchemy ORM + Pydantic (relational integrity, validation at boundaries)
  - **Async tasks**: Celery + Redis (offload heavy/slow jobs from request lifecycle)
  - **Auth**: JWT with refresh token rotation, RBAC
  - **Rate limiting**: Applied to all public API endpoints

- Any deviation from the baseline requires the same justification process above — document it in the PR.

### Risk Flags — Critical Path Changes

The following categories of changes are **high-risk** and require an explicit warning to the user and their confirmation before proceeding:

- **Core API routes**: any modification to existing public endpoints (breaking contract risk)
- **Auth & session logic**: JWT handling, token rotation, RBAC rules, middleware
- **Payment & billing flows**: charge logic, refund flows, reconciliation
- **Data migrations**: schema changes, column drops, index changes — always via Alembic, never by hand
- **Shared infrastructure**: Redis config, Celery workers, background job queues
- **Third-party integrations**: changes to external API clients that affect live data or SLAs
- **Environment & secrets management**: any change to how secrets or config are loaded

When in doubt about whether a change is critical: **flag it anyway.**

### Security (Non-negotiable)
- JWT auth on all protected routes. Refresh token rotation.
- Input validation via Pydantic on all API boundaries.
- No raw SQL. SQLAlchemy ORM or Core only.
- Secrets via environment variables. No hardcoded credentials, ever.
- OWASP Top 10 checklist mentally applied before any new endpoint ships.

### API Versioning
- All public endpoints under `/api/v1/`.
- ⚠️ Changes here are **breaking risk territory** — warn the user explicitly before modifying existing routes.
- New functionality gets new routes; don't silently alter existing contracts.

### Scalability
- Design for horizontal scale from day one (stateless API, Redis-backed sessions/cache).
- Celery workers for anything that can be async (don't block the request lifecycle).
- DB migrations via Alembic. Never mutate the schema by hand.

### Code Quality
- Type hints on all Python functions.
- Pydantic schemas for all request/response models.
- No dead code, no commented-out blocks, no `TODO: fix later` in committed code.
- Keep functions small and single-purpose.

---

## 4. Subagents

Use subagents (via the `Task` tool) for:
- **Code reviews**: spawn a review agent before committing non-trivial changes.
- **Security audits**: spawn a security-focused agent for any auth or payment-adjacent code.
- **Research**: spawn an explore agent to investigate the codebase before making assumptions.

Do not do in the main context what a subagent can do in parallel.

---

## 5. CHANGELOG.md Format

```
## [YYYY-MM-DD HH:MM] — <Feature Name>
**Changes**: <bullet list of what changed>
**PR/Push**: <link or branch>
**Why it mattered**: <business outcome in one sentence>
```

---

## 6. Branch & Git Conventions

- **Never commit or push directly to `main`.** Always work on a feature branch.
- **Always use feature branches** — even for small changes. `main` is protected.
- **Update `CHANGELOG.md` before opening a PR** — not after, not during merge. This is a hard gate.
- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Claude-generated branches: `claude/<task-id>`
- Commit messages: imperative mood, ≤72 chars subject, body explains *why* not *what*.
- Push with: `git push -u origin <branch-name>`
- Never force-push to `main` or shared branches.

---

## 7. Checklist Before Every Commit

- [ ] Working on a feature branch — never on `main`
- [ ] All tests pass (100%)
- [ ] No hardcoded secrets or credentials
- [ ] Critical path changes reviewed and confirmed with user
- [ ] CHANGELOG.md updated with timestamp and business rationale (required before PR)
- [ ] PRO vs AGAINST debate completed for non-trivial features
- [ ] Subagent review done for complex or security-sensitive code
