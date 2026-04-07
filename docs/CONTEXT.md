# Axon Platform — Master Context Document

> **Single source of truth.** Use this file to onboard AI coding assistants (Cursor, Copilot, Claude), resume work after any break, and stay consistent across all parts of the system. Update it when decisions change.
>
> **Author:** Vedant Lahane | **Year:** 2026 | **Status:** Active development

### Implementation Snapshot (March 2026)

- The running repository currently exposes compatibility routes under `/api/` (aligned with frontend integration), while `/api/v1/` remains the long-term architecture target.
- Database schema changes are now managed through Alembic migrations in `backend/alembic/` (runtime table auto-creation was removed).
- Chat in `backend/routers/api_compat.py` is wired to a LangGraph-backed agent pipeline in `backend/agent/pipeline.py` (`collect_context -> build_prompt -> generate_answer`) with provider routing (Gemini/OpenAI) and local context tools (documents + SQLite schema/query context).

---

## Table of Contents

1. [What Axon Is](#1-what-axon-is)
2. [What Verdant Is](#2-what-verdant-is)
3. [How They Connect](#3-how-they-connect)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Architecture Overview](#6-architecture-overview)
7. [Database Models](#7-database-models)
8. [API Contract](#8-api-contract)
9. [Agent and Tools](#9-agent-and-tools)
10. [MCP Server](#10-mcp-server)
11. [DevOps Pipeline](#11-devops-pipeline)
12. [Environment Variables](#12-environment-variables)
13. [Hard Rules — Never Break These](#13-hard-rules--never-break-these)
14. [Development Workflow](#14-development-workflow)
15. [Phased Roadmap](#15-phased-roadmap)
16. [Decision Log](#16-decision-log)
17. [Prompts for AI Coders](#17-prompts-for-ai-coders)

---

## 1. What Axon Is

> **"An AI system intelligence engine that analyzes, diagnoses, and improves software systems using multi-source signals."**

Axon is **not** a chatbot. It is **not** a RAG wrapper. It is an AI that understands running systems the way a senior engineer does — by correlating logs, metrics, database signals, and a structured graph of the system's topology, then reasoning over all of it together.

### Core loop

```
Signals (logs, metrics, SQL, PDFs)
        +
System graph (Verdant .vrd topology)
        ↓
LangGraph ReAct agent (reasoning + tool orchestration)
        ↓
Structured insight (root cause, affected node, suggested fix)
        +
Graph visualization (highlighted node in Verdant panel)
```

### What Axon produces

- Explanations of why something is slow or broken
- Root cause with confidence score and graph path
- Recommendations and suggested fixes
- A `.vrd` string describing the current system state (fed to Verdant for visualization)
- Incident post-mortems (structured, exportable)

---

## 2. What Verdant Is

> **"A developer-first architecture language and visualization engine that turns system descriptions into structured graphs and 3D diagrams."**

Verdant is a **completely independent project** — a separate GitHub repository published as npm packages. It has zero knowledge of Axon. Axon treats Verdant exactly like it treats React or Tailwind — a dependency it installs, not a service it calls.

### What Verdant owns

| Concern | Owner |
|---|---|
| `.vrd` DSL syntax | Verdant |
| Text → AST parsing | Verdant |
| Graph data structure (nodes, edges, groups) | Verdant |
| 2D layout engine | Verdant |
| 3D React Three Fiber renderer | Verdant |
| Theme system | Verdant |

### How Axon uses Verdant

- **Backend:** `axon/agent/verdant_tool.py` generates `.vrd` strings describing the system topology inferred from signals. These are stored in the `SystemGraph` model.
- **Frontend:** `@verdant/core` is imported to parse `.vrd` strings into an AST. `@verdant/react` renders the AST as either a 2D node graph (default) or a 3D scene (on toggle). The Verdant panel reads from `/api/v1/system-graph/`.

### The two-input model

```
.vrd string (topology)     →  what the system looks like
state_overlay JSON         →  what it looks like RIGHT NOW (node health)
        ↓
Frontend merges both → colored live graph (red node = degraded)
```

These are always two separate inputs. The `.vrd` topology is stable. The `state_overlay` changes on every Axon analysis.

---

## 3. How They Connect

```
User query
    ↓
Axon reasoning engine (FastAPI + LangGraph)
    ↓
Tools called: pdf_tool, sql_tool, tavily_tool, logs_tool, metrics_tool, verdant_tool
    ↓
verdant_tool.py produces .vrd string from inferred topology
    ↓
Stored in SystemGraph model (vrd_string + state_overlay)
    ↓
Frontend polls /api/v1/system-graph/
    ↓
@verdant/core parses .vrd → AST
    ↓
VerdantPanel renders 2D graph (React Flow) or 3D scene (@verdant/react)
    ↓
Nodes colored by state_overlay: teal=healthy, amber=degraded, red=critical
    ↓
When Axon answers "why is db slow?", those nodes pulse in the graph panel
```

**The interface between Axon and Verdant is a string.** The `.vrd` format is the contract. Nothing else is shared.

---

## 4. Technology Stack

### Backend (`axon/`)

| Layer | Technology | Notes |
|---|---|---|
| Framework | FastAPI | Async-native, streaming-first |
| ASGI server | Uvicorn | Dev: `--reload`. Prod: via Docker |
| ORM | SQLAlchemy (async) | `asyncpg` driver |
| Migrations | Alembic | Replaces Django `manage.py migrate` |
| Auth | JWT via `python-jose` | `passlib[bcrypt]` for password hashing |
| Config | `pydantic-settings` | Reads from `.env`, type-safe |
| AI orchestration | LangGraph v1.x + LangChain v0.3.x | ReAct agent pattern |
| LLM providers | Google Gemini 2.0 Flash (default), OpenAI GPT-4o | Switchable per user |
| Web search | Tavily API | |
| Document processing | PyPDFLoader + pgvector embeddings | No more InMemoryVectorStore |
| Vector store | pgvector (PostgreSQL extension) | Persists across restarts |
| Database | Supabase PostgreSQL | Managed, includes pgvector, backups |
| Cache / rate limit | Redis | `redis:7-alpine` |
| Export | python-docx (DOCX), openpyxl (XLSX) | |

### MCP Server (`mcp/`)

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Protocol | `mcp` Python SDK (`pip install mcp`) |
| Transport | SSE over HTTP at `/mcp` |

### Frontend (`frontend/`)

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 7.x |
| Styling | TailwindCSS 4.x + CSS custom properties |
| Animation | Framer Motion |
| SQL editor | Monaco Editor |
| Markdown | react-markdown + remark-gfm |
| Graph (2D) | React Flow (for Verdant panel) |
| Graph (3D) | `@verdant/react` (React Three Fiber) |
| Graph parsing | `@verdant/core` |
| Diagrams | Mermaid.js (schema only — will be replaced by Verdant) |
| Hosting | Vercel (auto-deploys on push to `main`) |

### Infrastructure

| Concern | Tool |
|---|---|
| Cloud | AWS EC2 (t3.medium, Ubuntu 24.04) |
| Container registry | AWS ECR (3 repos: backend, mcp, frontend) |
| IaC provisioning | Terraform |
| Server configuration | Ansible (role-based) |
| Reverse proxy | Nginx (TLS termination, upstream routing) |
| CI/CD | GitHub Actions |
| Metrics | Prometheus + Grafana |
| Host monitoring | Nagios |
| Alerting | Alertmanager |
| DB | Supabase (external, managed) |

---

## 5. Repository Structure

```
axon-platform/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Runs on every PR: lint, typecheck, test, docker build
│       ├── cd-staging.yml          # Auto-deploys on push to develop branch
│       └── cd-prod.yml             # Deploys to prod — requires manual GitHub approval
│
├── backend/                        # FastAPI application
│   ├── main.py                     # App entry point, router registration, startup events
│   ├── config.py                   # pydantic-settings Config class — all env vars typed here
│   ├── database.py                 # SQLAlchemy async engine + session factory + get_db dependency
│   ├── Dockerfile                  # Multi-stage: builder → slim runtime
│   ├── requirements.txt
│   ├── alembic/                    # Database migrations
│   │   ├── env.py
│   │   ├── alembic.ini
│   │   └── versions/               # One file per migration
│   ├── auth/
│   │   ├── jwt.py                  # create_access_token, verify_token
│   │   └── dependencies.py         # get_current_user FastAPI dependency
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                 # User, UserPreferences
│   │   ├── conversation.py         # Conversation, Message, MessageFeedback, MessageAttachment
│   │   ├── document.py             # UploadedDocument, UploadedDatabase, DatabaseConnection
│   │   └── system_graph.py         # SystemGraph, SystemGraphSnapshot
│   ├── schemas/                    # Pydantic request/response models
│   │   ├── auth.py                 # RegisterRequest, LoginRequest, TokenResponse
│   │   ├── conversation.py         # ConversationOut, MessageOut, ChatRequest
│   │   ├── database.py             # DBConnectionRequest, SchemaResponse, QueryRequest
│   │   └── graph.py                # SystemGraphOut, StateOverlayIn, NodeStateOut
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                 # /auth/register, /auth/login, /auth/me, /auth/password/*
│   │   ├── chat.py                 # /chat/ (SSE streaming), /conversations/*
│   │   ├── documents.py            # /documents/ upload/list/delete
│   │   ├── database.py             # /database/connection, /database/schema, /database/query
│   │   ├── graph.py                # /system-graph/ GET/POST + /system-graph/history/
│   │   ├── export.py               # /conversations/{id}/export (DOCX, ZIP)
│   │   └── health.py               # /health/ with DB status
│   └── agent/
│       ├── agent.py                # LangGraph ReAct agent — tools registered here
│       ├── pdf_tool.py             # pgvector similarity search over uploaded PDFs
│       ├── sql_tool.py             # DB schema introspection + query suggestion
│       ├── tavily_tool.py          # Real-time web search
│       ├── logs_tool.py            # Structured log ingestion and pattern extraction
│       ├── metrics_tool.py         # Prometheus-style metrics parsing and querying
│       └── verdant_tool.py         # Infers system topology → produces .vrd string
│
├── mcp/
│   ├── server.py                   # MCP server — exposes Axon data as tools
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── Dockerfile                  # Stage 1: node:20 build. Stage 2: nginx:alpine serve
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useConversationManager.ts
│       │   ├── useDatabaseSettings.ts
│       │   ├── useGraphSync.ts         # NEW — syncs Verdant panel with chat state
│       │   ├── useSqlConsole.ts
│       │   └── useKeyboardShortcuts.ts
│       ├── services/
│       │   ├── authApi.ts              # Auth endpoints
│       │   ├── chatApi.ts              # Chat + conversation endpoints (SSE consumer)
│       │   ├── databaseApi.ts          # DB connection + schema + query endpoints
│       │   ├── graphApi.ts             # NEW — system graph endpoints
│       │   └── exportApi.ts            # Export endpoints
│       ├── types/
│       │   ├── chat.ts
│       │   ├── graph.ts                # NEW — VrdAST types, StateOverlay, NodeState
│       │   ├── speech.d.ts
│       │   └── mermaid.d.ts
│       ├── utils/
│       │   ├── chatMappers.ts
│       │   └── sqlUtils.ts
│       └── components/
│           ├── LandingPage.tsx
│           ├── Toast.tsx
│           ├── chat/
│           │   ├── ChatDisplay.tsx
│           │   ├── MessageBubble.tsx       # extracted from ChatDisplay
│           │   ├── AssistantMessage.tsx    # extracted from ChatDisplay
│           │   ├── InputSection.tsx
│           │   ├── MarkdownRenderer.tsx
│           │   └── ScrollToBottom.tsx
│           ├── layout/
│           │   ├── Sidebar.tsx
│           │   └── MainPanel.tsx
│           ├── Canvas/                     # SQL IDE panel
│           │   ├── index.tsx
│           │   ├── SqlResultsView.tsx
│           │   ├── SqlPendingApprovalPanel.tsx
│           │   ├── SqlHistoryPanel.tsx
│           │   ├── SqlSuggestionsPanel.tsx
│           │   └── SchemaDiagram.tsx
│           ├── Graph/                      # NEW — Verdant graph panel
│           │   ├── index.tsx               # Panel wrapper, 2D/3D toggle
│           │   ├── GraphNode.tsx           # Node component with health coloring
│           │   ├── GraphEdge.tsx           # Edge component
│           │   └── GraphControls.tsx       # Toggle, zoom, timeline scrubber
│           └── modals/
│               ├── AuthModal.tsx
│               └── DatabaseConnectionModal.tsx
│
├── infra/
│   ├── terraform/
│   │   ├── main.tf                 # AWS provider + S3 remote state
│   │   ├── vpc.tf                  # VPC, subnet, IGW, route table
│   │   ├── ec2.tf                  # t3.medium instance, elastic IP, user data
│   │   ├── security_groups.tf      # Inbound: 22 (your IP), 80, 443, 9090/3000 (your IP)
│   │   ├── ecr.tf                  # 3 ECR repos: axon/backend, axon/mcp, axon/frontend
│   │   ├── variables.tf
│   │   └── outputs.tf              # EC2 public IP, ECR URLs — needed for Ansible + Actions
│   ├── ansible/
│   │   ├── roles/
│   │   │   ├── common/             # Docker, Docker Compose, AWS CLI, UFW, swap
│   │   │   ├── nginx/              # Nginx install, TLS via Certbot, reverse proxy config
│   │   │   ├── app/                # Pull ECR images, docker-compose up, systemd service
│   │   │   └── monitoring/         # Prometheus, Grafana, Alertmanager, Nagios
│   │   ├── playbooks/
│   │   │   ├── setup_server.yml    # Run once after Terraform: applies all roles
│   │   │   └── deploy_backend.yml  # Run on every deploy: pulls new image + restarts
│   │   ├── inventory/
│   │   │   ├── hosts.ini
│   │   │   └── group_vars/
│   │   │       ├── webserver.yml
│   │   │       ├── vault.yml       # ENCRYPTED — API keys, secrets
│   │   │       └── monitoring.yml
│   │   └── templates/
│   │       ├── axon.env.j2
│   │       ├── axon-gunicorn.service.j2
│   │       └── nagios-axon-backend.cfg.j2
│   └── nginx/
│       └── nginx.conf              # Upstream axon:8000, axon_mcp:8001. TLS, gzip, headers.
│
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml          # Scrape: axon:8000/metrics, node-exporter, cadvisor, redis
│   ├── grafana/
│   │   └── dashboards/
│   │       └── axon.json           # Dashboard: req rate, p95 latency, error rate, LLM calls
│   └── alertmanager/
│       └── rules.yml               # Alerts: error_rate>5%, latency>3s, disk>80%
│
├── docker-compose.yml              # Local dev — all services + hot reload
├── docker-compose.prod.yml         # Production — uses ECR image tags
├── Makefile                        # Shortcuts: make dev, make test, make migrate, etc.
├── .env.example                    # Template — copy to .env, never commit .env
└── README.md
```

---

## 6. Architecture Overview

### Request lifecycle (chat endpoint)

```
POST /api/v1/chat/
        ↓
FastAPI router (chat.py)
        ↓
get_current_user dependency (JWT validation)
        ↓
Load conversation history from DB
        ↓
LangGraph ReAct agent invoked (async, streaming)
        ↓
Agent decides which tools to call:
  - pdf_tool     → pgvector similarity search
  - sql_tool     → DB schema + query suggestion
  - tavily_tool  → web search
  - logs_tool    → log pattern extraction
  - metrics_tool → metric time-series query
  - verdant_tool → topology inference → .vrd string
        ↓
Tool results injected into agent context
        ↓
Agent produces final answer
        ↓
SSE StreamingResponse — tokens streamed to frontend as they arrive
        ↓
Message + tool calls saved to DB
        ↓
If verdant_tool was called: SystemGraph model updated
        ↓
Frontend graph panel polls /api/v1/system-graph/ → updates visualization
```

### Three-panel UI layout

```
┌─────────────┬─────────────────────────────┬─────────────────────┐
│             │                             │                     │
│  Sidebar    │      Chat panel             │  Canvas panel       │
│             │                             │  (SQL IDE or        │
│  - convos   │  Messages stream in via     │   Verdant graph)    │
│  - docs     │  SSE. Markdown rendered.    │                     │
│  - settings │  Graph nodes highlight      │  Toggle: SQL / Graph│
│             │  when Axon finds root cause │  2D / 3D toggle     │
│             │                             │                     │
└─────────────┴─────────────────────────────┴─────────────────────┘
```

---

## 7. Database Models

### `users`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | String unique | |
| hashed_password | String | bcrypt |
| is_active | Boolean | default true |
| created_at | DateTime | |

### `user_preferences`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| model_preference | String | "gemini-2.0-flash" \| "gpt-4o" |
| theme | String | "dark" \| "light" |

### `conversations`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| title | String | |
| summary | Text | AI-generated |
| created_at | DateTime | |
| updated_at | DateTime | |

### `messages`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| conversation_id | UUID FK | |
| role | Enum | "user" \| "assistant" |
| content | Text | |
| tool_calls | JSONB | LangGraph tool call log |
| created_at | DateTime | |

### `message_feedback`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| message_id | UUID FK | |
| feedback_type | Enum | "like" \| "dislike" \| "report" |

### `uploaded_documents`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| filename | String | |
| file_path | String | |
| vector_indexed | Boolean | true once pgvector has embeddings |
| created_at | DateTime | |

### `database_connections`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| connection_type | Enum | "sqlite" \| "url" |
| connection_url | String | encrypted at rest |
| is_active | Boolean | |

### `system_graphs` *(new)*

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| vrd_string | Text | Current `.vrd` topology |
| state_overlay | JSONB | `{ nodeId: { status, metric, label } }` |
| updated_at | DateTime | |

### `system_graph_snapshots` *(new)*

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| graph_id | UUID FK → system_graphs | |
| vrd_string | Text | Point-in-time snapshot |
| state_overlay | JSONB | Health state at this moment |
| captured_at | DateTime | Used by timeline scrubber |

---

## 8. API Contract

All routes are prefixed `/api/v1/`. Auth header: `Authorization: Bearer <jwt_token>`.

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Email + password registration |
| POST | `/auth/login` | Returns JWT access token |
| GET | `/auth/me` | Current user info |
| POST | `/auth/password/reset` | Sends reset email (real email, not token in response) |
| POST | `/auth/password/reset/confirm` | Confirm with token from email |
| POST | `/auth/password/change` | Change password (authenticated) |
| PUT | `/auth/profile` | Update display name etc. |

### Chat

| Method | Route | Description |
|---|---|---|
| POST | `/chat/` | SSE stream — sends `data: {chunk}` tokens |
| GET | `/conversations/` | List user's conversations |
| GET | `/conversations/{id}/` | Conversation + messages |
| DELETE | `/conversations/{id}/` | Delete with associated files |
| GET | `/conversations/{id}/export/` | Export to DOCX |
| POST | `/conversations/{id}/export/zip/` | Export to ZIP |

### Documents

| Method | Route | Description |
|---|---|---|
| POST | `/documents/` | Upload PDF — triggers pgvector indexing async |
| GET | `/documents/` | List uploaded documents |
| DELETE | `/documents/{id}/` | Delete + remove from vector store |

### Database

| Method | Route | Description |
|---|---|---|
| POST | `/database/connection` | Save DB connection config |
| GET | `/database/connection` | Get current connection |
| DELETE | `/database/connection` | Remove connection |
| POST | `/database/connection/test` | Test connectivity |
| POST | `/database/upload` | Upload SQLite file |
| GET | `/database/schema` | Returns schema JSON |
| POST | `/database/query` | Execute approved SQL |
| POST | `/database/query/suggestions` | AI SQL suggestions (agent call) |
| POST | `/database/export` | Export results to XLSX |

### System Graph *(new)*

| Method | Route | Description |
|---|---|---|
| GET | `/system-graph/` | Returns current vrd_string + state_overlay |
| POST | `/system-graph/` | Save new .vrd (from verdant_tool or manual) |
| PATCH | `/system-graph/state` | Update state_overlay only (signal data) |
| GET | `/system-graph/history/` | List of snapshots with timestamps |

### MCP *(separate service)*

| Method | Route | Description |
|---|---|---|
| * | `/mcp` | MCP SSE transport — all tool calls handled here |

### Models + Preferences

| Method | Route | Description |
|---|---|---|
| GET | `/models/` | List available LLM models |
| POST | `/models/set` | Set active model for user |
| GET | `/preferences/` | Get user preferences |
| PUT | `/preferences/` | Update preferences |

### Feedback + Health

| Method | Route | Description |
|---|---|---|
| POST | `/messages/{id}/feedback/` | Like/dislike/report |
| DELETE | `/messages/{id}/feedback/` | Remove feedback |
| GET | `/health/` | Health check with DB status |

---

## 9. Agent and Tools

### LangGraph ReAct agent (`backend/agent/agent.py`)

- Pattern: ReAct (Reason + Act) — agent decides which tools to call based on the query
- All tool calls are `async` — no `asyncio.run()` wrappers needed in FastAPI
- Conversation history loaded from DB per request — agent is stateless between requests
- Model loaded from `UserPreferences` per user — no module-level global model state
- Streaming: use `agent.astream_events()` to yield tokens to the SSE response

### Tool contract

Every tool must be an `async def` decorated with `@tool`. Return types must be JSON-serializable. Tools must never write to the DB directly — they return data; the router handles persistence.

### `pdf_tool.py`

- Input: `query: str`, `user_id: str`
- Searches pgvector for top-5 similar chunks from user's uploaded documents
- Returns: list of `{content, filename, score}`

### `sql_tool.py`

- `get_schema(user_id)` → returns DB schema as structured JSON
- `suggest_query(question, schema)` → returns SQL in a markdown code block
- **The agent NEVER executes SQL directly.** It suggests. User approves. Frontend sends to `/database/query`.

### `tavily_tool.py`

- Input: `query: str`
- Returns: top search results with title, URL, content snippet

### `logs_tool.py` *(new — Phase 2)*

- Input: `log_content: str` (pasted or uploaded log file)
- Parses timestamps, service names, error patterns
- Returns: `{errors: [...], services: [...], timeline: [...], anomalies: [...]}`

### `metrics_tool.py` *(new — Phase 2)*

- Input: `metrics_content: str` (Prometheus export or CSV), `query: str`
- Returns structured time-series data relevant to the query

### `verdant_tool.py` *(new — Phase 2)*

- Called after root cause analysis to produce a visualization
- Input: `services: list[str]`, `connections: list[{from, to, label}]`, `states: dict`
- Produces `.vrd` string and saves to `SystemGraph` model
- Returns: the `.vrd` string

---

## 10. MCP Server

The MCP server exposes Axon's system graph and reasoning as callable tools for any MCP-compatible AI agent (Claude, Cursor, Copilot, custom agents).

### File: `mcp/server.py`

```python
from mcp.server.fastapi import create_mcp_server

mcp = create_mcp_server(name="axon")

@mcp.tool()
async def get_system_graph(user_id: str) -> dict:
    """Returns the .vrd topology + node health state for a user's system."""

@mcp.tool()
async def get_node_health(node_id: str, user_id: str) -> dict:
    """Returns current health metrics for a specific node."""

@mcp.tool()
async def get_root_cause(symptom: str, user_id: str) -> str:
    """Runs Axon reasoning to diagnose a symptom. Returns structured analysis."""

@mcp.tool()
async def query_signal_history(node_id: str, from_ts: str, to_ts: str) -> list:
    """Returns health snapshots for a node over a time range."""

mcp_app = mcp.get_asgi_app()
```

### Mounting in `main.py`

```python
app.mount("/mcp", mcp_app)
```

### How a developer connects

1. Add `https://your-domain.com/mcp` to Cursor or Claude.ai MCP settings
2. AI tool calls `tools/list` → receives 4 tool definitions with input schemas
3. When developer asks "why is checkout slow?", the LLM decides to call `get_system_graph()` + `get_node_health("checkout-service")`
4. Real system data flows into LLM context — answer is grounded in actual topology

---

## 11. DevOps Pipeline

### Branch strategy

```
main          → production (protected, requires PR + approval)
develop       → staging (protected, requires PR)
feature/*     → PR into develop
hotfix/*      → PR directly into main + backmerge to develop
```

### CI pipeline (`.github/workflows/ci.yml`)

Triggers: every `pull_request`

```
Jobs (parallel):
  lint-backend:   ruff check + mypy
  lint-frontend:  tsc --noEmit + eslint
  test-backend:   pytest with postgres service container (min 80% coverage target)
  build-images:   docker build axon + mcp + frontend (verifies Dockerfiles)
```

All jobs must pass before merge is allowed.

### CD staging (`.github/workflows/cd-staging.yml`)

Triggers: push to `develop`

```
1. Build images, tag as staging-{git-sha}
2. Push to AWS ECR
3. SSH into EC2 via Ansible
4. ansible-playbook deploy_backend.yml -e "image_tag=staging-{sha}"
5. docker-compose up -d --no-deps axon mcp  (zero-downtime rolling restart)
```

### CD production (`.github/workflows/cd-prod.yml`)

Triggers: push to `main`

```
1. Same as staging
2. BUT: environment: production  ← requires manual GitHub UI approval
3. Tag as v{semver}
4. Create GitHub Release automatically
5. Deploy to production EC2
```

### Ansible roles

| Role | Purpose |
|---|---|
| `common` | Docker, Docker Compose, AWS CLI, UFW, swap, unattended upgrades |
| `nginx` | Install Nginx, configure reverse proxy, TLS via Certbot (Let's Encrypt) |
| `app` | Create `/opt/axon/`, copy docker-compose.prod.yml + .env, pull ECR images, start containers, systemd |
| `monitoring` | Prometheus + Grafana + Alertmanager + Nagios via Docker |

### Terraform resources

| Resource | Config |
|---|---|
| EC2 | `t3.medium`, Ubuntu 24.04, elastic IP, user data installs Docker |
| VPC | 1 VPC, 1 public subnet, IGW, route table |
| Security groups | Inbound: 22 (your IP), 80 (world), 443 (world), 9090+3000 (your IP) |
| ECR | 3 repos: `axon/backend`, `axon/mcp`, `axon/frontend` |
| S3 | Terraform remote state bucket |
| DynamoDB | Terraform state lock table |

### Monitoring

| Tool | Role |
|---|---|
| Prometheus | Scrapes `/metrics` every 15s. App metrics via `prometheus-fastapi-instrumentator`. Custom counters: `llm_api_calls_total`, `agent_tool_calls_total`. |
| Grafana | Dashboard: request rate, p95 latency, error rate, LLM calls by model. Auto-provisioned from `axon.json`. |
| Alertmanager | Alert rules: error_rate > 5% for 5min, p95 latency > 3s for 5min, disk > 80%. Routes to email/Slack. |
| Nagios | Host-level: is Docker running, is Nginx running, disk usage, CPU. Pages on process death. |

### Nginx routing

```nginx
upstream axon     { server 127.0.0.1:8000; }
upstream axon_mcp { server 127.0.0.1:8001; }

server {
    listen 443 ssl;
    location /api/    { proxy_pass http://axon; }
    location /mcp/    { proxy_pass http://axon_mcp; }
    location /metrics { proxy_pass http://axon; allow your.ip; deny all; }
}
```

Frontend is served by Vercel (separate CDN — no Nginx needed for frontend).

---

## 12. Environment Variables

### Backend `.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | YES | — | JWT signing key. **Fail hard if missing.** No fallback. |
| `DATABASE_URL` | YES | — | Supabase PostgreSQL URL with pgvector |
| `REDIS_URL` | YES | `redis://redis:6379` | Rate limiting + caching |
| `GOOGLE_API_KEY` | Recommended | — | Gemini 2.0 Flash |
| `OPENAI_API_KEY` | Recommended | — | GPT-4o + embeddings |
| `TAVILY_API_KEY` | Optional | — | Web search |
| `JWT_ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | 24 hours |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | CORS origins |
| `ENVIRONMENT` | No | `development` | `development` \| `staging` \| `production` |
| `EMAIL_HOST` | Yes (prod) | — | SMTP for password reset emails |
| `EMAIL_PORT` | Yes (prod) | `587` | |
| `EMAIL_USER` | Yes (prod) | — | |
| `EMAIL_PASSWORD` | Yes (prod) | — | |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL. In dev: `http://localhost:8000`. In prod: `https://api.yourdomain.com` |

### GitHub Secrets (Settings → Secrets → Actions)

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with ECR push permissions only |
| `AWS_SECRET_ACCESS_KEY` | Same IAM user |
| `EC2_HOST` | EC2 public IP from Terraform output |
| `EC2_SSH_KEY` | Private key PEM for EC2 SSH |
| `GOOGLE_API_KEY` | |
| `OPENAI_API_KEY` | |
| `TAVILY_API_KEY` | |
| `DATABASE_URL` | Supabase connection string |
| `SECRET_KEY` | Production JWT key |

---

## 13. Hard Rules — Never Break These

### Security

- `SECRET_KEY` must never have a fallback default. If the env var is missing, the app must raise `ValueError` and refuse to start.
- Password reset must send an email. Never return the reset token in an API response.
- Rate limit `/api/v1/chat/` (20 req/min per user) and `/api/v1/auth/` (5 req/min per IP). Use Redis-backed rate limiting.
- CSRF: JWT in `Authorization` header — no sessions, no `@csrf_exempt` needed.
- Never commit `.env`, `*.pem`, `vault.yml` (unencrypted), or `db.sqlite3` to git.
- Ansible vault password file (`.vault_password`) must be in `.gitignore`.
- Metrics endpoint (`/metrics`) must be IP-restricted at Nginx level.

### Agent

- The agent must never execute SQL directly. It suggests SQL in markdown code blocks. The user approves. The frontend sends the approved SQL to `/api/v1/database/query/`.
- The agent is stateless between requests. Never rely on module-level mutable state (`_AGENTS`, `_MEMORIES`, `_CURRENT_MODEL`). Load everything from DB per request.
- All tool functions must be `async def`. Never use `asyncio.run()` inside FastAPI.

### Architecture boundaries

- Verdant owns: `.vrd` DSL, parsing, AST, layout, rendering.
- Axon owns: data ingestion, reasoning, tool orchestration, system intelligence.
- Axon backend never renders 3D. It produces `.vrd` strings.
- Verdant (npm package) never processes logs or calls AI for decisions.
- The interface between Axon backend and Verdant frontend is a `.vrd` string + a `state_overlay` JSON. These are always two separate things.

### Code quality

- `views.py` monolith must never be recreated. One router file per domain.
- Every endpoint must have a corresponding Pydantic schema for request and response.
- Every new model must have an Alembic migration. Never edit existing migrations.
- No inline styles in the frontend mixed with Tailwind. Pick one.
- TypeScript strict mode. No `(x as SomeType)` casts to silence type errors — fix the types.

### DevOps

- Never push directly to `main` or `develop`. Always use a PR.
- CI must pass before any merge. No exceptions.
- Production deploys require the GitHub environment approval gate. Never bypass it.
- `docker-compose.prod.yml` must only reference images from ECR. Never `build:` in prod.
- Terraform state must be remote (S3). Never local state in a team context.

---

## 14. Development Workflow

### Daily cycle

```bash
# 1. Start local environment
make dev                          # docker-compose up --build

# 2. Start a feature
git checkout develop
git pull
git checkout -b feature/add-logs-tool

# 3. Develop
# axon/ hot-reloads via --reload
# frontend: npm run dev in /frontend (faster than Docker for HMR)

# 4. Run tests before pushing
make test                         # pytest in container
make lint                         # ruff + eslint

# 5. Migrate if you changed models
make migrate                      # alembic upgrade head

# 6. Push + open PR to develop
git push origin feature/add-logs-tool
# → CI runs (3-5 min)
# → Merge when green
# → Staging auto-deploys (5 min after merge)
# → Test on staging URL

# 7. Weekly: release to production
git checkout main
git merge develop
git push
# → GitHub Actions pauses, waits for your approval
# → Click "Approve and deploy" in GitHub UI
# → Prod deploys
```

### Makefile shortcuts

```makefile
make dev            # docker-compose up --build
make test           # pytest with coverage
make lint           # ruff + eslint
make migrate        # alembic upgrade head
make shell          # exec into axon container
make logs           # follow axon + mcp logs
make infra-plan     # terraform plan
make infra-apply    # terraform apply
make deploy-staging # manual Ansible staging deploy
```

### Adding a new tool to the agent

1. Create `backend/agent/new_tool.py`
2. Define `async def your_tool(input: str) -> dict` decorated with `@tool`
3. Import and register in `backend/agent/agent.py` tools list
4. Add to agent system prompt description
5. Write at least 2 tests in `backend/tests/test_tools/test_new_tool.py`
6. Add to MCP server in `mcp/server.py` if external AI tools should call it

### Adding a new API endpoint

1. Create or update the appropriate router in `backend/routers/`
2. Define request schema in `backend/schemas/`
3. Define response schema in `backend/schemas/`
4. Add the route to `backend/main.py` if it's a new router file
5. Write at least one test in `backend/tests/test_routers/`
6. Update this document's API Contract section

---

## 15. Phased Roadmap

### Phase 0 — Emergency security (1 week) `NOW`

- [ ] Remove hardcoded `SECRET_KEY` fallback — fail hard if not set
- [ ] Fix password reset — send real email, remove token from API response
- [ ] Add rate limiting to `/chat/` and `/auth/` (Redis-backed)
- [ ] Switch to JWT auth — remove all session/CSRF complexity
- [ ] Add React `ErrorBoundary` at App level and around Canvas panel

### Phase 1 — Clean foundation (3 weeks) `ACTIVE`

- [ ] `docker-compose up` works with all services (axon, mcp, postgres, redis)
- [ ] All existing Django features ported to FastAPI routers
- [ ] Pydantic schemas replace all manual `_serialise_*` functions
- [ ] Alembic migrations replace Django migrations
- [ ] Supabase + pgvector replaces SQLite + InMemoryVectorStore
- [ ] Streaming SSE responses for `/chat/`
- [ ] GitHub Actions CI pipeline green on first PR
- [ ] Terraform provisions EC2 + ECR
- [ ] Ansible configures server (all 4 roles)
- [ ] Staging auto-deploys working

### Phase 2 — System intelligence (4 weeks)

- [ ] `logs_tool.py` — structured log ingestion and pattern extraction
- [ ] `metrics_tool.py` — Prometheus-style metrics parsing
- [ ] `verdant_tool.py` — topology inference → `.vrd` string production
- [ ] `SystemGraph` model + `/api/v1/system-graph/` endpoints
- [ ] `state_overlay` patching (signal data separate from topology)
- [ ] Graph panel in frontend (2D, React Flow, health-colored nodes)
- [ ] `useGraphSync` hook — chat root cause highlights graph nodes
- [ ] Auto-Verdant: scan connected DB schema → generate `.vrd` automatically
- [ ] MCP server functional with 4 tools, mounted at `/mcp`
- [ ] Prometheus instrumentation + Grafana dashboard live
- [ ] First 40 backend tests (target 60% coverage)

### Phase 3 — Full Verdant integration (6 weeks)

- [ ] Install `@verdant/core` and `@verdant/react` from npm
- [ ] 2D/3D toggle in graph panel (same AST, two renderers)
- [ ] Timeline scrubber — `SystemGraphSnapshot` model + frontend slider
- [ ] Incident post-mortem auto-generation (structured document from analysis)
- [ ] Conversation search (PostgreSQL full-text search on messages)
- [ ] Skeleton loading states across all panels
- [ ] 80% test coverage target
- [ ] Production deploy stable with monitoring alerting configured

### Phase 4 — Platform (future)

- [ ] Real-time signal ingestion (WebSocket from connected systems)
- [ ] Anomaly detection (statistical baseline + deviation alerts)
- [ ] Policy-as-graph (architectural rules encoded in `.vrd`, Axon enforces)
- [ ] Team workspaces (multi-user, shared system graphs)
- [ ] API key management (users bring their own LLM keys)
- [ ] Axon MCP server published publicly (any AI tool can connect to Axon)

---

## 16. Decision Log

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Backend framework | FastAPI | Django | LangGraph is async-first; streaming is native in FastAPI; no sync/async impedance mismatch |
| Auth method | JWT (Authorization header) | Django sessions | Simpler for SPA + API architecture; no CSRF needed; works across Vercel + EC2 |
| ORM | SQLAlchemy (async) | Django ORM | Framework-agnostic; async-native; better for FastAPI patterns |
| Migrations | Alembic | Django manage.py migrate | Pairs with SQLAlchemy; same mental model |
| Database | Supabase PostgreSQL | Self-managed EC2 PostgreSQL | Managed backups, connection pooling, pgvector included; eliminates DB ops burden |
| Vector store | pgvector (Supabase) | InMemoryVectorStore, Pinecone, Qdrant | Already paying for Supabase; pgvector is free with it; survives restarts; no extra service |
| CI/CD | GitHub Actions | Jenkins | Jenkins needs its own server; Actions is free, code-configured, native to repo |
| Config management | Ansible | Puppet | Same problem (idempotent config); Ansible is push-based, simpler for small server count |
| Frontend hosting | Vercel | EC2 Nginx | Vercel handles CDN, TLS, auto-deploys on push; no ops cost |
| Graph 2D renderer | React Flow | D3, Cytoscape | Best React integration; node/edge model maps directly to Verdant AST |
| Monitoring split | Nagios (host) + Prometheus (app) | One tool for both | Different concerns; Nagios for process survival, Prometheus for app behavior |
| .vrd + state_overlay | Two separate inputs | Embed state in .vrd | Topology is stable; signal data changes constantly; separating avoids regenerating topology on every metric update |

---

## 17. Prompts for AI Coders

### For Cursor / Copilot — general context

```
I'm building Axon, an AI system intelligence platform. Backend is FastAPI + LangGraph
(Python 3.13, async SQLAlchemy, Alembic, JWT auth, Supabase PostgreSQL with pgvector).
Frontend is React 19 + TypeScript + Vite + TailwindCSS 4.

The LangGraph agent uses a ReAct pattern with 6 tools: pdf_tool, sql_tool, tavily_tool,
logs_tool, metrics_tool, verdant_tool. All tools are async def. The agent is stateless
between requests — loaded fresh from DB conversation history each time.

The system graph is stored as a .vrd string (Verdant DSL) + a separate state_overlay JSON
(node health data). The frontend reads both from /api/v1/system-graph/ and renders them
via @verdant/core (parser) and React Flow (2D renderer).

Full context in AXON_CONTEXT.md at repo root.
```

### For new feature work

```
I need to add [FEATURE] to Axon. The relevant files are:
- backend/routers/[domain].py — add the route here
- backend/schemas/[domain].py — add request/response schemas
- backend/models/[model].py — if new DB model needed
- backend/agent/[tool].py — if new agent tool needed
- frontend/src/services/[domain]Api.ts — frontend API call
- frontend/src/components/[Component].tsx — UI

Rules: all routes are under /api/v1/. Use Pydantic schemas for all I/O.
Agent tools must be async def and return JSON-serializable data only.
The agent never executes SQL — it suggests, user approves.
```

### For debugging agent reasoning

```
The Axon LangGraph agent uses ReAct pattern. If the agent isn't calling the right tools,
check: 1) tool descriptions in the @tool docstring — the LLM uses these to decide,
2) the system prompt in backend/agent/agent.py, 3) whether the tool is registered in
the tools list passed to the agent constructor.

The agent streams via agent.astream_events(). The SSE route in backend/routers/chat.py
consumes this stream and yields tokens to the frontend.
```

---

*Last updated: 2026 | Maintained by Vedant Lahane*
*Update this document when any architectural decision changes.*