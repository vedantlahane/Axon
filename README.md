# Axon - AI-Powered Document and Database Intelligence Platform

![Working](https://img.shields.io/badge/status-working-brightgreen)
![Python](https://img.shields.io/badge/python-3.13+-blue)
![React](https://img.shields.io/badge/react-19-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

Axon is a full-stack AI workspace that lets users upload documents and databases, explore schema and data, and chat with an agent that uses conversation history plus local tools (document context and safe SQL context) to produce grounded answers.

The current backend is FastAPI + SQLAlchemy (async) with Alembic migrations. The frontend is React 19 + TypeScript + Vite.

## Preview

<div align="center">
<img src="frontend/public/Axon1.png" alt="Axon dashboard" width="30%" />
<img src="frontend/public/Axon2.png" alt="Document management" width="30%" />
<img src="frontend/public/Axon3.png" alt="Conversation flow" width="30%" />
</div>

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | FastAPI, SQLAlchemy (async), Alembic, python-jose, passlib |
| Agent pipeline | LangGraph StateGraph executor, provider routing (Gemini/OpenAI), document context tool, SQLite schema/query context tools |
| Frontend | React 19, Vite, TypeScript, TailwindCSS, Framer Motion, Monaco Editor |
| Database | SQLite by default (`sqlite+aiosqlite`), PostgreSQL-compatible URL supported |
| Export | DOCX/ZIP/XLSX-compatible export endpoints |
| Deployment | Terraform, Ansible, Nginx, Docker |

---

## Key Features

### AI Chat Pipeline
- LangGraph-driven node pipeline (`collect_context` -> `build_prompt` -> `generate_answer`)
- Conversation-aware responses (history included in prompt)
- Model preference routing (`gemini` and `gpt-4o`)
- Graceful fallback when no provider API key is configured
- Tool-assisted context:
  - document excerpt context from attached files
  - SQLite schema snapshot for schema-oriented prompts
  - safe read-only SQL sampling when SQL is provided

### Document and Conversation Management
- Upload and attach documents to messages
- Conversation history and message threading
- Conversation export to DOCX/ZIP
- Message feedback endpoints (like/dislike/report)

### Database Workspace
- Save and test DB connection settings
- Schema inspection
- Query execution for SQL workspace
- Query suggestion endpoint and export endpoint

---

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+

### 1. Clone

```bash
git clone https://github.com/vedantlahane/Axon.git
cd Axon
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment

Create or update root `.env` (project root) with at least:

```env
# Backend core
SECRET_KEY=change-me
DATABASE_URL=sqlite+aiosqlite:///./backend/axon.db

# Optional AI providers (at least one recommended)
GEMINI_API_KEY=...
OPENAI_API_KEY=...
# Alternative naming also supported by pipeline:
# GOOGLE_API_KEY=...
```

### 4. Run Database Migrations (Alembic)

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 5. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Start Frontend

```bash
cd frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
```

### 7. Access

| Service | URL |
| --- | --- |
| Web App | http://localhost:5173 |
| API Root | http://localhost:8000/api/ |
| Health | http://localhost:8000/api/health/ |

---

## Migration Workflow (Formal Schema Management)

Axon now uses Alembic migrations instead of runtime table auto-create.

### Apply latest migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### Create a new migration after model changes

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "describe change"
```

### Roll back one revision

```bash
cd backend
source venv/bin/activate
alembic downgrade -1
```

### Included migration history

- `20260331_0001_create_core_tables`
- `20260331_0002_add_messages_tables`

---

## API Overview

All compatibility routes are under `/api/`.

### Auth
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `POST /api/auth/password/reset/`
- `POST /api/auth/password/reset/confirm/`
- `POST /api/auth/password/change/`
- `PUT /api/auth/profile/`

### Chat and Conversations
- `POST /api/chat/`
- `GET /api/conversations/`
- `GET /api/conversations/{id}/`
- `DELETE /api/conversations/{id}/`
- `GET /api/conversations/{id}/export/`
- `POST /api/conversations/{id}/export/zip/`

### Documents
- `GET /api/documents/`
- `POST /api/documents/`
- `GET /api/documents/{id}/download/`
- `DELETE /api/documents/{id}/`

### Database
- `GET /api/database/connection/`
- `POST /api/database/connection/`
- `DELETE /api/database/connection/`
- `POST /api/database/connection/test/`
- `POST /api/database/query/`
- `GET /api/database/schema/`
- `POST /api/database/query/suggestions/`
- `POST /api/database/export/`

### Models, Preferences, Feedback
- `GET /api/models/`
- `POST /api/models/set/`
- `GET /api/preferences/`
- `PUT /api/preferences/update/`
- `POST /api/messages/{id}/feedback/`
- `DELETE /api/messages/{id}/feedback/delete/`

---

## Project Structure (Current)

```text
Axon/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── agent/
│   │   ├── __init__.py
│   │   └── pipeline.py
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── 20260331_0001_create_core_tables.py
│   │       └── 20260331_0002_add_messages_tables.py
│   ├── models/
│   │   ├── user.py
│   │   ├── conversation.py
│   │   ├── message.py
│   │   ├── document.py
│   │   └── system_graph.py
│   └── routers/
│       ├── api_compat.py
│       ├── auth.py
│       ├── chat.py
│       ├── database.py
│       ├── documents.py
│       ├── export.py
│       ├── graph.py
│       └── health.py
├── frontend/
│   ├── package.json
│   └── src/
└── CONTEXT.md
```

---

## Development Checks

### Backend

```bash
cd backend
source venv/bin/activate
python -m compileall .
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

---

## Notes

- `CONTEXT.md` is the long-form architecture document and should stay aligned with implementation decisions.
- This repository currently exposes compatibility endpoints expected by the frontend while incrementally moving toward the broader architecture documented in `CONTEXT.md`.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
