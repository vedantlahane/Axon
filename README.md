# Axon - AI-Powered Document and Database Intelligence Platform

![Working](https://img.shields.io/badge/status-working-brightgreen)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![React](https://img.shields.io/badge/react-19+-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.116+-009485)
![License](https://img.shields.io/badge/license-MIT-green)

Axon is a full-stack AI workspace that lets users upload documents and databases, explore schema and data, and chat with an agent that uses conversation history plus local tools (document context and safe SQL context) to produce grounded answers.

The backend is **FastAPI + SQLAlchemy (async)** with **Alembic** migrations for schema management. The frontend is **React 19 + TypeScript + Vite 7** with **TailwindCSS 4** for styling.

## Preview

<div align="center">
<img src="frontend/public/Axon1.png" alt="Axon dashboard" width="30%" />
<img src="frontend/public/Axon2.png" alt="Document management" width="30%" />
<img src="frontend/public/Axon3.png" alt="Conversation flow" width="30%" />
</div>

---

## Tech Stack

| Layer | Technologies | Version |
| --- | --- | --- |
| **Backend Runtime** | FastAPI, Uvicorn, ASGI | FastAPI 0.116+, Uvicorn 0.35+ |
| **Database & ORM** | SQLAlchemy (async), Alembic, aiosqlite, asyncpg | SQLAlchemy 2.0+, Alembic 1.16+ |
| **Authentication** | python-jose (JWT), passlib (bcrypt), email-validator | python-jose 3.3+, passlib 1.7+ |
| **AI/Agent Pipeline** | LangGraph (StateGraph), provider routing (Gemini/OpenAI) | LangGraph 0.2+ |
| **Frontend Runtime** | React, React Router, Zustand (state) | React 19.1+, React Router 7.14+, Zustand 5.0+ |
| **Frontend Tooling** | Vite, TypeScript, ESLint, TailwindCSS | Vite 7.1+, TypeScript 5.8+, TailwindCSS 4.1+ |
| **Frontend UI** | Monaco Editor, Framer Motion, Lucide Icons | Monaco Editor 0.52+, Framer Motion 11.11+ |
| **Database Support** | SQLite (default via aiosqlite), PostgreSQL-compatible | sqlite+aiosqlite, asyncpg 0.30+ |
| **Export** | DOCX/ZIP/XLSX via openpyxl | openpyxl 3.1+ |
| **Deployment** | Terraform, Ansible, Nginx, Docker | (In infra/ and monitoring/) |

---

## Key Features

### AI Chat Pipeline
- LangGraph-driven node pipeline (`collect_context` → `build_prompt` → `generate_answer`)
- Conversation-aware responses (history included in prompt)
- Model preference routing (Gemini, GPT-4, etc.)
- Graceful fallback when no provider API key is configured
- Tool-assisted context:
  - Document excerpt context from attached files
  - Database schema snapshot for schema-oriented queries
  - Safe read-only SQL sampling with query validation

### Document and Conversation Management
- Upload and attach documents to messages
- Conversation history with message threading
- Conversation export to DOCX/ZIP formats
- Message feedback submission (helpful/unhelpful/report)
- Conversation organization and search

### Database Workspace
- Save and test DB connection settings
- Schema inspection and visualization
- Query execution for SQLite/PostgreSQL databases
- Query suggestion endpoint powered by LLM
- Query results export to Excel/CSV

---

## Quick Start

### Prerequisites

- **Python** 3.10 or higher (tested on 3.13+)
- **Node.js** 18 or higher (npm 9+)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/vedantlahane/Axon.git
cd Axon
```

### 2. Backend Setup

#### Linux / macOS

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

#### Windows (PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

If script execution is blocked, run this once in the current PowerShell session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then re-run the Activate script above.

### 3. Configure Environment

Create or update root `.env` (project root) with:

```env
# Backend core
APP_NAME=Axon AI Platform
API_PREFIX=/api
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./backend/axon.db
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Optional LLM providers (at least one recommended for chat features)
GEMINI_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=
TAVILY_API_KEY=

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api
```

> **Note:** For production, change `SECRET_KEY` to a strong random value. See `.env.example` for all available settings.

### 4. Run Database Migrations (Alembic)

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
alembic upgrade head
```

This creates the initial schema: `users`, `conversations`, `messages`, `documents`, etc.

### 5. Start Backend

From repo root:

```bash
source backend/venv/bin/activate
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the provided Makefile:

```bash
make backend-run
```

Backend will be ready at `http://localhost:8000`.

### 6. Start Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend reads `VITE_API_BASE_URL` from the workspace root `.env` and connects to `http://localhost:8000/api`.

### 7. Access the Application

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API ReDoc | http://localhost:8000/redoc |
| API Root | http://localhost:8000/api/ |
| Health Check | http://localhost:8000/api/health/ |

---

## Database Schema & Migrations

Axon uses **Alembic** for versioned schema management. Do NOT manually call `Base.metadata.create_all()`.

### Apply Latest Migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### Create a New Migration After Model Changes

```bash
cd backend
source venv/bin/activate
# Edit models as needed, then:
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

### Roll Back One Revision

```bash
cd backend
source venv/bin/activate
alembic downgrade -1
```

### Existing Migration History

- `20260331_0001_create_core_tables` – Users, conversations, documents
- `20260331_0002_add_messages_tables` – Message threads and feedback

---

## API Routes

All endpoints are under `/api/` prefix (configured via `API_PREFIX` in settings).

### Authentication

- `POST /api/auth/register/` – Create new account
- `POST /api/auth/login/` – Get access token
- `POST /api/auth/logout/` – Revoke session
- `GET /api/auth/me/` – Current user profile
- `POST /api/auth/password/reset/` – Request password reset
- `POST /api/auth/password/reset/confirm/` – Confirm reset with token
- `POST /api/auth/password/change/` – Change password (authenticated)
- `PUT /api/auth/profile/` – Update user profile

### Conversations & Messages

- `POST /api/chat/` – Send message to agent (creates/continues conversation)
- `GET /api/conversations/` – List user's conversations
- `GET /api/conversations/{id}/` – Get conversation details with messages
- `DELETE /api/conversations/{id}/` – Delete conversation
- `GET /api/conversations/{id}/export/` – Export as DOCX
- `POST /api/conversations/{id}/export/zip/` – Export as ZIP archive

### Documents

- `GET /api/documents/` – List uploaded documents
- `POST /api/documents/` – Upload new document
- `GET /api/documents/{id}/download/` – Download document file
- `DELETE /api/documents/{id}/` – Delete document

### Database Workspace

- `GET /api/database/connection/` – Get saved connection settings
- `POST /api/database/connection/` – Save connection (SQLite/PostgreSQL URL)
- `DELETE /api/database/connection/` – Clear connection
- `POST /api/database/connection/test/` – Test connection validity
- `POST /api/database/upload/` – Upload SQLite file
- `POST /api/database/query/` – Execute read-only query
- `GET /api/database/schema/` – Fetch schema metadata
- `POST /api/database/query/suggestions/` – Get AI-generated query suggestions
- `POST /api/database/export/` – Export query results

### Models & Preferences

- `GET /api/models/` – List available LLM models
- `POST /api/models/set/` – Set preferred model (Gemini/OpenAI/etc.)
- `GET /api/preferences/` – User settings and preferences
- `PUT /api/preferences/update/` – Update user preferences
- `POST /api/messages/{id}/feedback/` – Rate message (helpful/unhelpful)
- `DELETE /api/messages/{id}/feedback/delete/` – Clear message feedback

---

## Development & Testing

### Backend Checks

Syntax validation:

```bash
cd backend
source venv/bin/activate
python -m compileall .
```

Run unit tests:

```bash
cd backend
python -m unittest -v \
  backend.tests.test_agent_pipeline \
  backend.tests.test_agent_chat_api \
  backend.tests.test_agent_model_preferences \
  backend.tests.test_api_end_to_end
```

Or use Makefile:

```bash
make backend-test
```

Run live provider tests (requires `GEMINI_API_KEY` or `OPENAI_API_KEY`):

```bash
AXON_RUN_LIVE_PROVIDER_TESTS=1 python -m unittest -v backend.tests.test_agent_live_provider
```

Or:

```bash
make backend-test-live
```

### Frontend Checks

Lint frontend code:

```bash
cd frontend
npm run lint
```

Build for production:

```bash
cd frontend
npm run build
```

Preview production build:

```bash
cd frontend
npm run preview
```

---

## Project Structure

```
Axon/
├── .env                                    # Environment variables (local)
├── .env.example                            # Environment template
├── backend/
│   ├── main.py                             # FastAPI app entry point
│   ├── config.py                           # Pydantic settings
│   ├── database.py                         # SQLAlchemy async engine
│   ├── requirements.txt                    # Python dependencies
│   ├── alembic.ini                         # Migration config
│   ├── agent/
│   │   ├── __init__.py
│   │   └── pipeline.py                     # LangGraph StateGraph logic
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/                       # Versioned migrations
│   │       ├── 20260331_0001_create_core_tables.py
│   │       └── 20260331_0002_add_messages_tables.py
│   ├── auth/
│   │   ├── dependencies.py                 # JWT token verification
│   │   └── jwt.py                          # Token encode/decode
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── document.py
│   │   └── system_graph.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── api_compat.py                   # Main router (includes all sub-routers)
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── database.py
│   │   ├── documents.py
│   │   ├── export.py
│   │   ├── graph.py
│   │   └── health.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── conversation.py
│   │   ├── database.py
│   │   └── graph.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── README.md
│   │   ├── test_*.py                       # Unit test suite
│   │   ├── test_support.py                 # Common test utilities
│   │   └── warnings_config.py
│   └── [uploads/]                          # Dynamic: user file storage
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── eslint.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx                         # Root router and providers
│   │   ├── main.tsx                        # React DOM mount
│   │   ├── index.css                       # Global styles (TailwindCSS + custom)
│   │   ├── components/
│   │   │   ├── Canvas/                     # Database schema viewer
│   │   │   ├── chat/
│   │   │   ├── command/
│   │   │   ├── documents/
│   │   │   ├── errors/
│   │   │   ├── layout/
│   │   │   ├── library/
│   │   │   ├── modals/
│   │   │   ├── settings/
│   │   │   └── skeletons/
│   │   ├── hooks/                          # Custom React hooks
│   │   ├── stores/                         # Zustand state stores
│   │   ├── services/                       # API client functions
│   │   ├── types/                          # TypeScript interfaces
│   │   ├── utils/                          # Helpers and utilities
│   │   └── styles/                         # TailwindCSS modules
│   └── public/                             # Static assets
├── docs/
│   ├── README.md
│   ├── CONTEXT.md                          # Architecture & design decisions
│   ├── DEPLOYMENT.md                       # Deployment guide
│   └── presentation/
├── infra/
│   ├── terraform/                          # IaC for cloud deployment
│   ├── ansible/                            # Configuration management
│   └── nginx/
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── alertmanager/
├── mcp/
│   ├── server.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml                      # Local dev stack
├── docker-compose.prod.yml                 # Production stack
├── Makefile                                # Development shortcuts
└── README.md                               # This file
```

---

## Important Notes

### Schema Management
- **Do NOT** reintroduce `Base.metadata.create_all()` in `backend/main.py`
- Always use Alembic migrations via `alembic revision --autogenerate`
- This ensures reproducible, versioned schema changes

### Authentication & Security
- Passwords are hashed with **bcrypt** via `passlib` (pbkdf2_sha256 backend)
- JWTs are signed using `ALGORITHM=HS256` (configurable)
- `ACCESS_TOKEN_EXPIRE_MINUTES` controls session duration (default: 60 minutes)
- Always set a strong `SECRET_KEY` in production

### API Compatibility
- Frontend expects routes under `/api/` prefix (not `/api/v1` or unversioned)
- Configure via `API_PREFIX` in settings
- CORS is enabled for localhost development ports; update for production

### Frontend Asset Structure
- The `stitch/` directory contains design system components and UI modules
- Component hierarchy: `Canvas/` → database schema, `chat/` → messaging UI, etc.
- Styling uses TailwindCSS 4 with custom tokens in `src/styles/`

### Environment Variables Required for Features
- **Chat**: At least one of `GEMINI_API_KEY`, `GOOGLE_API_KEY`, or `OPENAI_API_KEY`
- **Database**: PostgreSQL support via `DATABASE_URL` (e.g., `postgresql+asyncpg://...`)
- **Web UI**: `VITE_API_BASE_URL` must point to your API backend

## Documentation

- **[CONTEXT.md](docs/CONTEXT.md)** – Architecture, design decisions, and system overview
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** – Deployment guides and infrastructure setup
- **Backend Tests** – `backend/tests/README.md` for test architecture

---

## License

Distributed under the MIT License. See `LICENSE` for details.
