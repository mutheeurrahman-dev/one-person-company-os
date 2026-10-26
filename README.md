# 🏢 One-Person Company OS — Autonomous Multi-Agent Business System

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--time-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://fastapi.tiangolo.com/advanced/websockets/)
[![Multi-Agent](https://img.shields.io/badge/Multi--Agent-Orchestration-8A2BE2?style=flat-square)](https://github.com/mutheeurrahman28it-jpg/one-person-company-os)

An autonomous, multi-agent operating system empowering solo founders to execute business operations through orchestrated AI agents (**Manager**, **Operations**, **Finance**, **Customer**, **Marketing**) with human-in-the-loop safety approvals and real-time WebSocket state streaming.

```mermaid
flowchart TD
    User["Solo Founder / Operator"] -->|Natural Language Command| UI["React 18 + Vite SPA"]
    UI -->|REST (JWT)| API["FastAPI Backend (:8000)"]
    API -.->|Real-time Agent Feed| WS["WebSocket Stream (/ws/activity)"] --> UI

    subgraph "Agentic Orchestration Layer"
        API --> Manager["Manager Agent<br/>(Task Decomposition & Dispatch)"]
        Manager --> Ops["Operations Agent<br/>(Inventory, Orders)"]
        Manager --> Fin["Finance Agent<br/>(Ledger, Cost Anomalies)"]
        Manager --> Cust["Customer Agent<br/>(CRM, Outreach)"]
        Manager --> Mkt["Marketing Agent<br/>(Campaigns & Copy)"]
    end

    subgraph "Safety & Persistence"
        Mkt --> Approval{"Human Approval Gate<br/>(Budget > $0)"}
        Approval -->|Confirmed| Exec["Execution Engine"]
        Ops --> DB[("Async SQLite / PostgreSQL<br/>(SQLAlchemy ORM)")]
        Fin --> DB
        Cust --> DB
        Exec --> DB
    end
```

---

## 1. Architecture at a glance

```
Browser (React + Vite, :5173)
   │  REST (axios, Bearer JWT)         │  WebSocket (/ws/activity?token=...)
   ▼                                    ▼
FastAPI backend (:8000)
   │
   ├─ Manager Agent  → decomposes your request into an ordered task list
   ├─ Operations Agent → inventory checks, order processing
   ├─ Finance Agent     → revenue/expense ledger, unusual-spend flagging
   ├─ Customer Agent    → customer lookups, confirmation messages
   ├─ Marketing Agent   → campaign proposals (ALWAYS require human approval)
   │
   └─ SQLite (async, via SQLAlchemy) — survives restarts
```

Every workflow run writes real `Workflow` / `AgentTask` / `AgentExecution` /
`AgentMessage` rows and broadcasts each state change over WebSocket, so the
Live Agent Activity feed and the Agent Activity history page reflect what the
backend actually did — nothing in the UI is a canned/simulated log line.

---

## 2. Prerequisites

| Tool | Version used in this checkpoint |
|---|---|
| Python | 3.12 |
| Node.js | 22 |
| npm | 10 |

No external services are required. SQLite is the default database and the
app runs fully offline with a deterministic rule-based "LLM" fallback if you
don't have an Anthropic API key (see the env var table below).

---

## 3. Backend setup

```bash
cd backend
python3 -m venv venv

# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
# venv\Scripts\Activate.ps1

pip install -r requirements.txt

cp .env.example .env
# Edit .env if needed (see the env var table in section 5) — the defaults
# work out of the box with LLM_PROVIDER left as "anthropic" but no key set,
# which is treated the same as "none": deterministic fallback agents.

python -m app.seed_data
```

You should see:

```
Seed complete.
  Login email:    demo@companyos.dev
  Login password: demo1234
  Business:       Demo Threads Co.
```

The seed script is idempotent-ish: if the demo user already exists, it exits
without duplicating data, so it's safe to re-run.

**Run the backend:**

```bash
uvicorn app.main:app --reload --port 8000
```

Verify it's up: `curl http://localhost:8000/api/health` → `{"status":"ok",...}`

---

## 4. Frontend setup

In a **second terminal**, from the project root:

```bash
cd frontend
npm install
cp .env.example .env   # already points VITE_API_URL at http://localhost:8000
npm run dev
```

Vite will print a local URL — open **http://localhost:5173**. Log in with the
seeded demo account (the login form is pre-filled with it):

```
Email:    demo@companyos.dev
Password: demo1234
```

Both servers need to be running at the same time — the frontend is a pure
API/WebSocket client and does nothing useful on its own.

---

## 5. Environment variables

### Backend (`backend/.env`, copied from `backend/.env.example`)

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./company_os.db` | Async SQLAlchemy connection string. Swap for `postgresql+asyncpg://user:pass@host:5432/db` to use Postgres instead — no code changes needed. |
| `JWT_SECRET_KEY` | `change-this-to-a-long-random-secret-in-production` | Signs/verifies login JWTs. **Change this in any real deployment** — anyone with this value can forge tokens. |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm (passed to `python-jose`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | How long a login token stays valid before the user is forced to log in again. |
| `LLM_PROVIDER` | `anthropic` | `"anthropic"` to use a real Claude model for customer messages and marketing copy, or `"none"` to force the deterministic rule-based fallback (works fully offline, no key needed). If set to `"anthropic"` but `ANTHROPIC_API_KEY` is empty, the app **silently falls back to rule-based** — see troubleshooting if generated text looks templated when you expected real LLM output. |
| `ANTHROPIC_API_KEY` | *(empty)* | Your Anthropic API key. Only read when `LLM_PROVIDER=anthropic`. |
| `LLM_MODEL` | `claude-sonnet-4-6` | Model string passed to the Anthropic SDK. |
| `APP_NAME` | `One-Person Company OS` | Cosmetic — shown in `/api/health` and available to the frontend. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of origins the backend will accept cross-origin requests/WebSocket connections from. **Must include whatever origin your frontend is actually served from**, or you'll hit CORS errors. |

### Frontend (`frontend/.env`, copied from `frontend/.env.example`)

| Variable | Default | What it does |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL the frontend uses for both REST calls and the WebSocket connection (the WS URL is derived from this by swapping `http`→`ws`). Change this if your backend runs on a different host/port. |

---

## 6. Testing the multi-agent workflow, step by step

This is the core feature — here's how to exercise it fully:

1. **Log in** with the demo account and land on the Dashboard.
2. Look at the **AI Command Box** header — it should say **"live feed
   connected"** with a green Wi-Fi icon. This confirms the WebSocket
   (`/ws/activity`) is connected and authenticated.
3. Type a command and hit **Execute**, e.g.:
   ```
   Sell 2 Shirts to Priya Sharma
   ```
4. Watch the **Live agent activity** panel (bottom-left of the Dashboard). You
   should see, in order, roughly:
   - `Manager — started — Analyzing business request: "..."`
   - `Manager — success — Decomposed request into 5 task(s)...`
   - `Operations — started/success — Checking inventory...`
   - `Operations — started/success — Processing order...`
   - `Finance — started/success — Updating revenue...`
   - `Customer — started/success — Looking up customer...`
   - `Customer — started/success — Generating customer confirmation message...`
   - `Manager — success — Workflow completed. ...`
   Each line arrives live over the WebSocket as the backend actually executes
   it — there's no artificial delay or replay.
5. Check that the **stat tiles** (Today's revenue, Total orders, Low stock,
   etc.) update shortly after the workflow completes, and that a new row
   shows up on the **Orders** and **Finance** pages.
6. Now trigger a workflow that requires **human approval**:
   ```
   Propose a marketing campaign for the Kurta
   ```
   The workflow will stop at `waiting_approval` instead of completing. Go to
   the **Approvals** page — you should see a pending card with a proposal,
   caption, and estimated cost.
7. Click **Approve**. This actually finalizes the underlying task and
   workflow as completed (nothing is auto-approved or faked) — the workflow's
   status flips to `completed` on the **Agent Activity** page, and a fresh
   **Business Insights** entry may appear reflecting the change.
8. Try **Reject** on a different campaign — the workflow correctly ends as
   `failed` and no charge/side-effect is applied.
9. Visit **Agent Activity** to see the full historical log of every workflow
   you've run, expandable to show each task, its agent, status, retry count,
   and raw result payload.

### Example AI Manager commands that work with the seeded data

The seed data gives you 3 products (**Shirt**, **Kurta** — intentionally
low-stock, **Tote Bag**) and 2 customers (**Priya Sharma**, VIP; **Rahul
Verma**). These all produce real, verified results:

| Command | What happens |
|---|---|
| `Sell 2 Shirts to Priya Sharma` | Checks stock → creates order → records revenue → finds/creates the customer → drafts a confirmation message |
| `Process an order for customer Rahul for 3 Tote Bag` | Same pipeline, different product/customer |
| `Check for low stock items` | Operations Agent scans inventory and returns everything at/below its threshold (Kurta will show up) |
| `What is our financial performance this week` | Finance Agent returns total revenue, expenses, profit, and today's revenue |
| `Record a 1200 expense for packaging supplies` | Finance Agent records a real expense transaction in that category |
| `Propose a marketing campaign for the Kurta` | Marketing Agent drafts a proposal + caption, **and stops for your approval** — nothing "launches" automatically |
| `order 500 Hats for customer Ghost` | Intentional failure case — "Hats" doesn't exist as a product, so this correctly fails with a clear error rather than crashing |

### Other UI checks worth doing

- **Forms**: Customers → Add customer; Inventory → Add product, then the
  `+`/`−` stock buttons; Finance → Add transaction. All persist immediately
  and refetch the list.
- **Empty/loading/error states**: log in as a brand-new account (via
  Register) to see every page's empty state; briefly stop the backend while
  the frontend is open to see the "Could not reach the server" error banners.
- **Dark/light mode**: toggle it from the header or Settings page, then
  reload the browser tab — the theme is written to `localStorage`
  (`opco_theme`) and re-applied on load, so it persists across reloads and
  across the Landing/Login/Register pages too.

---

## 7. Bugs found and fixed in this pass

While testing end-to-end (not just checking for HTTP 200s), these real issues
surfaced and were fixed:

1. **Dashboard crash risk** — the live activity WebSocket hook
   (`useAgentActivityFeed`) accepted *every* message on the socket, including
   `workflow_update` frames that don't have an `agent` field. Rendering one
   called `agentLabel(undefined)`, which threw (`undefined.replace(...)`).
   Fixed by filtering the hook to only accept `agent_execution` events, and
   hardened `agentLabel` to handle a missing agent gracefully either way.
   Verified against real WebSocket traffic from a live workflow run.
2. **Font loading bug** — the Google Fonts `@import` in `index.css` was
   placed *after* the `@tailwind` directives, which is invalid per the CSS
   spec (`@import` must come first). Browsers are allowed to silently ignore
   an out-of-order `@import`. Moved it above the `@tailwind` lines; confirmed
   via a production build that the PostCSS warning disappeared.
3. **Silent no-op command** — `Record a ₹1200 expense for packaging
   supplies` is one of the example commands shown directly in the Dashboard's
   AI Command Box, but the Manager Agent's intent detection had no pattern
   for recording expenses/revenue by voice command at all, so it silently
   fell through to a generic financial summary instead of recording anything.
   Added amount/category extraction and `record_expense`/`record_revenue`
   intent detection to `manager_agent.py`, and verified the fixed command
   now creates a real transaction (checked via `/api/finance/transactions`)
   without breaking the order-processing or summary command paths.

All three were confirmed via live requests against the running app (API
calls, WebSocket traces, and a rebuilt frontend), not just read from the
source.

---

## 8. Troubleshooting

**Port already in use (backend or frontend won't start)**
Something else is already listening on 8000 or 5173.
```bash
# find and kill whatever's on the port (macOS/Linux)
lsof -i :8000
kill -9 <PID>
```
Or just run on a different port: `uvicorn app.main:app --port 8001` and
update `VITE_API_URL` accordingly, or `npm run dev -- --port 5174`.

**CORS errors in the browser console**
Usually means the frontend's origin isn't in the backend's `CORS_ORIGINS`.
If you're serving the frontend from anywhere other than
`localhost:5173`/`127.0.0.1:5173`, add that origin to `CORS_ORIGINS` in
`backend/.env` (comma-separated) and restart the backend.

**"live feed connected" never turns green / WebSocket won't connect**
- Confirm the backend is actually running and reachable at `VITE_API_URL`.
- Open the browser console/network tab and look at the WS handshake — a
  `403` on the handshake means the token was invalid or missing; try logging
  out and back in.
- The activity feed hook auto-reconnects with exponential backoff (1s → 2s →
  4s ... capped at 15s), so a brief backend restart will self-heal within
  ~15 seconds without needing a page reload.

**Getting logged out unexpectedly / 401s on every request**
Your JWT has expired (default lifetime is `ACCESS_TOKEN_EXPIRE_MINUTES`,
24h) or `JWT_SECRET_KEY` changed since you logged in (which invalidates all
previously-issued tokens). The frontend's API client already handles this
gracefully — a 401 clears the stored token and redirects to `/login`
automatically. Just log back in.

**A command doesn't do what you expected**
The Manager Agent uses fast, deterministic keyword-based intent detection
(see `backend/app/agents/manager_agent.py`), not a general-purpose LLM
parser, unless you've configured `LLM_PROVIDER=anthropic` with a real key —
and even then, the LLM is only used for *content generation* (customer
messages, campaign copy), not for deciding *which* agents to run. If a
command doesn't match a known pattern, it falls back to a general financial
summary + low-stock style response rather than failing outright. If you add
new intents, extend `decompose_request()`.

**Marketing campaigns "launch" immediately without asking me**
They shouldn't — `propose_campaign` is hardcoded with
`requires_approval: True` in `manager_agent.py`, and the workflow engine
intercepts any task flagged this way to create an `ApprovalRequest` instead
of executing it. If you've customized the agent and this stops working,
check that flag first.

**Seed script says "Demo user already exists. Skipping seed."**
That's expected if you've already seeded once — the script is idempotent.
If you want a truly fresh database, stop the backend and delete
`backend/company_os.db`, then re-run `python -m app.seed_data`.

**`ModuleNotFoundError` / import errors on the backend**
Make sure the virtual environment is activated before running `uvicorn` or
`python -m app.seed_data` — `pip install -r requirements.txt` installs into
whatever environment is currently active, and it's easy to forget the
`source venv/bin/activate` step in a new terminal tab.

**Frontend shows a blank page / console errors about `import.meta.env`**
Confirm `frontend/.env` exists (copied from `.env.example`) and that you
restarted `npm run dev` after creating/editing it — Vite only reads `.env`
files at startup, not on the fly.

---

## 9. Project structure

```
one-person-company-os/
├── backend/
│   ├── app/
│   │   ├── agents/          # Manager + 4 specialized agents (task execution logic)
│   │   ├── api/              # FastAPI routers (one per resource)
│   │   ├── config/           # Pydantic Settings (reads .env)
│   │   ├── database/         # Async engine/session, table creation
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── orchestration/    # Workflow engine, task manager, retry/failure logic
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Auth, approvals, insights, LLM provider abstraction
│   │   ├── tools/             # Real DB-backed tools agents call (finance/inventory/etc.)
│   │   ├── websocket/         # Connection manager + /ws/activity route
│   │   ├── main.py
│   │   └── seed_data.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout, shared UI kit, AgentDot, ProtectedRoute
│   │   ├── contexts/          # Auth + Theme React contexts
│   │   ├── hooks/             # useAgentActivityFeed (WebSocket subscription)
│   │   ├── lib/               # axios client, typed endpoint wrappers, agent metadata
│   │   ├── pages/             # 12 routed pages
│   │   └── types/             # TypeScript types mirroring backend schemas
│   ├── package.json
│   └── .env.example
└── README.md   ← you are here
```
