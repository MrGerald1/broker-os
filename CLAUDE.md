# CLAUDE.md — Broker OS

This file governs how Claude Code operates in this repository. Follow every rule here without exception.

---

## 1. Workflow: EXPLORE → PLAN → CODE → TEST → COMMIT

Every task, no matter how small, must move through each stage in order. Never skip.

### EXPLORE
- If ≥50% of the task is ambiguous (unclear requirements, edge cases, missing business logic), use the `AskUserQuestion` tool **first** before doing anything else.
- Examples of when to ask:
  - "Clarify: what is the B2B SME volume target for Group Life?"
  - "Clarify: should policy cancellations trigger a refund flow or just a status update?"
- **Never assume.** Surface ambiguity early. One wrong assumption in insurance data or billing can cause compliance or financial risk.

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
- Default tech stack (justified by performance and compliance needs):
  - **Backend**: FastAPI (async performance, OpenAPI docs out of the box)
  - **Frontend**: React + Vite (fast HMR, production build speed)
  - **Data layer**: PostgreSQL + SQLAlchemy (relational integrity for policy/claims data) + Pydantic (validation)
  - **Async tasks**: Celery + Redis (claims queue, notification dispatch, reconciliation jobs)
  - **Auth**: JWT with refresh tokens, role-based access control (RBAC)
  - **Rate limiting**: Applied to all `/api/v1` endpoints
- Bringing in a new language or framework requires justification. **No bloat.** If it doesn't earn its weight, don't add it.
- Prioritize: secure > correct > maintainable > fast.
- ⚠️ **Risk flag**: Any change to `/api/v1` (broker core) must include an explicit warning comment and user confirmation before implementation.

### TEST
- Write E2E tests using **pytest** (backend) and **pytest-playwright** (UI flows).
- Unit tests for all business logic (policy pricing, claims state machine, commission calculation, etc.).
- **100% of tests must pass before committing.** No exceptions. No "I'll fix it later."
- Fix all failures before moving on. If a test reveals a design flaw, revisit PLAN.

### COMMIT
- After every completed feature, update `CHANGELOG.md` with:
  - Timestamp (e.g., `2026-02-26 03:41`)
  - What changed
  - New pushes/PRs
  - **Why it mattered** — always tie to a business outcome
  - Example: `2026-02-26 03:41: Group Life API — Enables B2B payroll embed, de-risks 70% volume mandate`
- Do **not** start the next feature until the current one is committed, tested, and logged.

---

## 2. Business Context & Key Metrics

This is a broker OS for the Nigerian insurance market. Business goals are not background — they drive every technical decision.

| Metric | Target |
|--------|--------|
| CAC (B2B) | <₦5,000 |
| Churn | <35% |
| Group Life B2B SME volume | Mandate to be confirmed |

Every feature should be evaluated against: **"Does this move us toward these targets?"**

Before any refactor (especially repeated ones marked with `#`), ask: **"What is the impact on the goal?"** If the answer is unclear or negative, pause and escalate.

---

## 3. Standards & Guardrails

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

- Feature branches: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`
- Claude-generated branches: `claude/<task-id>`
- Commit messages: imperative mood, ≤72 chars subject, body explains *why* not *what*.
- Push with: `git push -u origin <branch-name>`
- Never force-push to `main` or shared branches.

---

## 7. Checklist Before Every Commit

- [ ] All tests pass (100%)
- [ ] No hardcoded secrets or credentials
- [ ] `/api/v1` changes reviewed and confirmed with user
- [ ] CHANGELOG.md updated with timestamp and business rationale
- [ ] PRO vs AGAINST debate completed for non-trivial features
- [ ] Subagent review done for complex or security-sensitive code
