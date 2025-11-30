# Axon – AI-Powered Document & Database Intelligence Platform

![Working](https://img.shields.io/badge/status-working-brightgreen)
![Python](https://img.shields.io/badge/python-3.13+-blue)
![React](https://img.shields.io/badge/react-19-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

Axon is a full-stack AI workspace that lets users upload documents (PDFs, databases) and interact with them through an intelligent conversational agent. The backend combines Django REST Framework with LangGraph for multi-model AI orchestration, while the frontend features a modern React + TypeScript interface with smooth animations powered by GSAP and Framer Motion.

## 🖼️ Preview

<div align="center">
<img src="frontend/public/Axon1.png" alt="Axon dashboard" width="30%" />
<img src="frontend/public/Axon2.png" alt="Document management" width="30%" />
<img src="frontend/public/Axon3.png" alt="Conversation flow" width="30%" />
</div>

---

## 🧱 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Backend** | Django 5 · Django REST Framework · LangGraph · LangChain · Gemini · OpenAI · Tavily |
| **Frontend** | React 19 · Vite · TypeScript · TailwindCSS 4 · GSAP · Framer Motion · Monaco Editor |
| **Database** | SQLite (default) · PostgreSQL/MySQL (configurable) |
| **Export** | python-docx · openpyxl (DOCX/XLSX generation) |
| **Deployment** | Ansible · Gunicorn · Vercel (frontend) |

---

## ✨ Key Features

### 🤖 Multi-Model AI
- **Gemini 2.0 Flash** (default) and **GPT-4o** support
- User-selectable model via settings
- Graceful fallback when API keys are missing

### 📄 Document Intelligence
- PDF upload with automatic RAG (Retrieval Augmented Generation)
- Document context used in conversations
- Per-conversation document management (add/remove documents mid-chat)

### 🗄️ Database Connectivity
- Connect to external SQL databases (PostgreSQL, MySQL)
- Upload SQLite files for analysis
- Interactive schema visualization with Mermaid diagrams
- Natural language to SQL query generation
- Query result export to XLSX

### 💬 Conversation Management
- Persistent chat history with message threading
- Message actions: copy, like, dislike, report
- Source citations for AI responses
- Export conversations to DOCX or ZIP (includes all attachments)
- Delete conversations with associated files

### 🔐 Authentication
- Token-based authentication
- User registration, login, logout
- Password reset with email confirmation
- Profile management

### 🎨 Modern UI/UX
- Animated dashboard with GSAP hero treatments
- Framer Motion for smooth transitions
- Monaco Editor for SQL queries
- Dark theme with blue accent (#2563eb)
- Responsive design

---

## 🚀 Quick Start

### Prerequisites

- Python **3.13+**
- Node.js **18+** (LTS recommended)
- API Keys: **Google AI (Gemini)** and/or **OpenAI**, **Tavily** (for web search)

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/vedantlahane/Axon.git
cd Axon
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your API keys:
# - GOOGLE_API_KEY=your-gemini-key
# - OPENAI_API_KEY=sk-...
# - TAVILY_API_KEY=tvly-...
# - DJANGO_SECRET_KEY=your-secret-key

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver
\`\`\`

### 3. Frontend Setup

\`\`\`bash
cd ../frontend
npm install
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
npm run dev
\`\`\`

### 4. Access the Application

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| API Root | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
| Health Check | http://localhost:8000/api/health/ |

---

## 🔐 Environment Variables

### Backend (\`backend/.env\`)

\`\`\`env
# AI Provider Keys (at least one required)
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...

# Django Settings
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# CORS & CSRF
FRONTEND_ORIGINS=http://localhost:5173,https://your-domain.com
CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://your-domain.com

# Database (default: SQLite)
# For PostgreSQL/MySQL:
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Static/Media Files
STATIC_ROOT=staticfiles
MEDIA_ROOT=media
\`\`\`

### Frontend (\`frontend/.env\`)

\`\`\`env
VITE_API_BASE_URL=http://localhost:8000/api
\`\`\`

---

## 🌐 API Endpoints

All endpoints are prefixed with \`/api/\`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \`/auth/register/\` | User registration |
| POST | \`/auth/login/\` | User login |
| POST | \`/auth/logout/\` | User logout |
| GET | \`/auth/me/\` | Current user info |
| POST | \`/auth/password/reset/\` | Request password reset |
| POST | \`/auth/password/change/\` | Change password |
| PATCH | \`/auth/profile/\` | Update profile |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/documents/\` | List user documents |
| POST | \`/documents/\` | Upload document |
| DELETE | \`/documents/{id}/\` | Delete document |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/conversations/\` | List conversations |
| GET | \`/conversations/{id}/\` | Get conversation detail |
| DELETE | \`/conversations/{id}/\` | Delete conversation |
| POST | \`/chat/\` | Send message |
| GET | \`/conversations/{id}/documents/\` | List conversation docs |
| DELETE | \`/conversations/{id}/documents/{doc_id}/\` | Remove doc from conversation |
| GET | \`/conversations/{id}/export/\` | Export to DOCX |
| GET | \`/conversations/{id}/export/zip/\` | Export to ZIP |

### Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | \`/database/connection/\` | Manage DB connection |
| POST | \`/database/connection/test/\` | Test connection |
| POST | \`/database/upload/\` | Upload SQLite file |
| GET | \`/database/schema/\` | Get database schema |
| POST | \`/database/query/\` | Execute SQL query |
| GET | \`/database/query/suggestions/\` | Get query suggestions |
| GET | \`/database/export/\` | Export results to XLSX |

### AI Models & Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/models/\` | List available models |
| POST | \`/models/set/\` | Set active model |
| GET | \`/preferences/\` | Get user preferences |
| PATCH | \`/preferences/update/\` | Update preferences |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \`/messages/{id}/feedback/\` | Submit feedback |
| DELETE | \`/messages/{id}/feedback/delete/\` | Remove feedback |

---

## 📁 Project Structure

\`\`\`
Axon/
├── backend/
│   ├── agent/                # Main Django app
│   │   ├── models.py         # Conversation, Message, Document, Feedback models
│   │   ├── views.py          # API endpoints (~2100 lines)
│   │   ├── urls.py           # URL routing
│   │   └── agent_new/        # LangGraph agent implementation
│   │       ├── agent.py      # Multi-model ReAct agent
│   │       ├── pdf_tool.py   # PDF RAG tool
│   │       ├── sql_tool.py   # SQL query tool
│   │       └── tavily_search_tool.py
│   ├── backend/              # Django project settings
│   ├── media/                # Uploaded files
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.tsx
│   │   │   ├── Canvas.tsx          # SQL results & schema view
│   │   │   ├── ChatDisplay.tsx     # Message rendering
│   │   │   ├── DatabaseConnectionModal.tsx
│   │   │   ├── InputSection.tsx    # Chat input
│   │   │   ├── MainPanel.tsx       # Main content area
│   │   │   ├── SchemaDiagram.tsx   # Mermaid diagram
│   │   │   └── Sidebar.tsx         # Conversation list
│   │   ├── services/
│   │   │   └── chatApi.ts          # API client
│   │   └── App.tsx                 # Root component
│   └── package.json
└── ansible/                  # Infrastructure automation
    ├── playbooks/
    └── inventory/
\`\`\`

---

## 🛠️ Development

### Running Tests

\`\`\`bash
# Backend
cd backend
source venv/bin/activate
python manage.py test agent

# Frontend
cd frontend
npm run lint
npm run build
\`\`\`

### Adding New Features

1. **Backend**: Add views in \`agent/views.py\`, URLs in \`agent/urls.py\`
2. **Frontend**: Add components in \`src/components/\`, API calls in \`services/chatApi.ts\`
3. **AI Tools**: Add new tools in \`agent/agent_new/\`

---

## ⚙️ Deployment

### Using Ansible

\`\`\`bash
# Setup backend server
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/setup_backend.yml

# Deploy backend
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/deploy_backend.yml

# Setup monitoring
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/provision_ngaios.yml
\`\`\`

### Frontend (Vercel)

The frontend is configured for Vercel deployment. Set \`VITE_API_BASE_URL\` in Vercel environment variables.

---

## 📝 License

Distributed under the MIT License. See \`LICENSE\` for more information.

---

Made with ❤️ by [Vedant Lahane](https://github.com/vedantlahane)
