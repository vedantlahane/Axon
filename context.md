# Axon Application Context & Critical Review

## Project Identity

**Name:** Axon – AI-Powered Document & Database Intelligence Platform  
**Type:** Full-stack web application  
**Author:** Vedant Lahane  
**Repository:** https://github.com/vedantlahane/Axon  

---

## Technology Stack

### Backend
- **Framework:** Django 5.2.7 with Django REST Framework
- **AI Orchestration:** LangGraph v1.x + LangChain v0.3.x
- **LLM Providers:** Google Gemini 2.0 Flash (default), OpenAI GPT-4o
- **Web Search:** Tavily API
- **Database:** SQLite (default), PostgreSQL/MySQL (configurable via DATABASE_URL)
- **Document Processing:** PyPDFLoader, OpenAI Embeddings with InMemoryVectorStore
- **Export:** python-docx (DOCX), openpyxl (XLSX)
- **Server:** Gunicorn
- **Python Version:** 3.13+

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7.x
- **Styling:** TailwindCSS 4.x with CSS custom properties
- **Animation:** Framer Motion
- **Code Editor:** Monaco Editor (for SQL)
- **Markdown:** react-markdown with remark-gfm
- **Diagrams:** Mermaid.js (for schema visualization)
- **Package Manager:** npm

### Infrastructure
- **Deployment:** Ansible playbooks to AWS EC2
- **Frontend Hosting:** Vercel
- **Monitoring:** Nagios (optional)

---

## Architecture Overview

### Directory Structure

```
Axon/
├── backend/                    # Django backend
│   ├── backend/               # Django project settings
│   │   ├── settings.py        # Configuration with env vars
│   │   ├── urls.py            # Root URL routing
│   │   └── views.py           # Home view
│   ├── agent/                 # Main Django app
│   │   ├── models.py          # Database models (8 models)
│   │   ├── views.py           # API views (~2200 lines, MONOLITHIC)
│   │   ├── urls.py            # API route definitions
│   │   └── agent_new/         # LangGraph AI agent
│   │       ├── agent.py       # ReAct agent with tools
│   │       ├── pdf_tool.py    # PDF RAG tool
│   │       ├── sql_tool.py    # Database introspection tools
│   │       └── tavily_search_tool.py
│   ├── media/                 # User uploads
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.tsx            # Root component (~400 lines)
│   │   ├── components/
│   │   │   ├── Canvas/        # SQL IDE (7 files)
│   │   │   ├── chat/          # Chat UI (4 files)
│   │   │   ├── layout/        # Layout components
│   │   │   └── modals/        # Auth + DB modals
│   │   ├── hooks/             # Custom React hooks (5 files)
│   │   ├── services/          # API client (~800 lines)
│   │   └── types/             # TypeScript types
│   └── package.json
├── ansible/                    # Deployment automation
│   ├── playbooks/
│   ├── templates/
│   └── inventory/
├── docs/                       # Documentation
└── scripts/                    # Utility scripts
```

### Database Models (agent/models.py)

1. **Conversation** - Chat sessions with title, summary, user FK
2. **Message** - Individual messages (user/assistant roles)
3. **UploadedDocument** - PDF files with user FK
4. **UploadedDatabase** - User-uploaded SQLite files
5. **MessageAttachment** - M2M link between messages and documents
6. **DatabaseConnection** - User's SQL connection config (sqlite/url)
7. **PasswordResetToken** - Password reset flow tokens
8. **MessageFeedback** - Like/dislike/report on messages
9. **UserPreferences** - Model preference, theme settings

### API Endpoints (agent/urls.py)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health/` | GET | Health check with DB status |
| `/api/chat/` | POST | Send message, get AI response |
| `/api/conversations/` | GET | List conversations |
| `/api/conversations/<id>/` | GET/DELETE | Conversation detail |
| `/api/conversations/<id>/export/` | GET | Export to DOCX |
| `/api/conversations/<id>/export/zip/` | POST | Export to ZIP with attachments |
| `/api/documents/` | GET/POST | Upload/list documents |
| `/api/documents/<id>/` | DELETE | Delete document |
| `/api/auth/register/` | POST | User registration |
| `/api/auth/login/` | POST | Session login |
| `/api/auth/logout/` | POST | Session logout |
| `/api/auth/me/` | GET | Current user info |
| `/api/auth/password/reset/` | POST | Request password reset |
| `/api/auth/password/reset/confirm/` | POST | Confirm password reset |
| `/api/auth/password/change/` | POST | Change password |
| `/api/auth/profile/` | PUT/PATCH | Update profile |
| `/api/database/connection/` | GET/POST/DELETE | Manage DB connection |
| `/api/database/connection/test/` | POST | Test DB connection |
| `/api/database/upload/` | POST | Upload SQLite file |
| `/api/database/schema/` | GET | Get database schema |
| `/api/database/query/` | POST | Execute SQL query |
| `/api/database/query/suggestions/` | POST | AI SQL suggestions |
| `/api/database/export/` | POST | Export query results to XLSX |
| `/api/models/` | GET | List available LLM models |
| `/api/models/set/` | POST | Set active model |
| `/api/messages/<id>/feedback/` | POST | Submit feedback |
| `/api/messages/<id>/feedback/delete/` | DELETE | Remove feedback |
| `/api/preferences/` | GET | Get user preferences |
| `/api/preferences/update/` | PUT/PATCH | Update preferences |

### AI Agent Architecture (agent_new/agent.py)

- Uses **LangGraph's ReAct agent** with MemorySaver checkpointing
- **Tools available to agent:**
  1. `search_pdf` - Similarity search over uploaded PDFs
  2. `get_database_schema` - Retrieve connected database schema
  3. `tavily_search` - Real-time web search
- **CRITICAL:** Agent does NOT have `run_sql_query` tool - it MUST suggest SQL in markdown code blocks for user approval
- System prompt enforces SQL query approval workflow

### Frontend State Management

- **No Redux/Zustand** - Pure React hooks with useState/useCallback
- State lifted to App.tsx, distributed via props
- Custom hooks encapsulate domain logic:
  - `useAuth` - Authentication state
  - `useConversationManager` - Chat history and messages
  - `useDatabaseSettings` - DB connection management
  - `useSqlConsole` - SQL editor state
  - `useKeyboardShortcuts` - Global hotkeys

---

## Critical Review (No Sugarcoating)

### Backend Issues

#### 1. **MONOLITHIC views.py (2200+ lines) - TERRIBLE**
The entire API is crammed into a single `views.py` file. This is a maintenance nightmare. No separation of concerns. Auth views, chat views, database views, export views - all in one file. A junior dev will get lost. A senior dev will cry.

**Impact:** Debugging is painful. Testing is incomplete. Onboarding new devs takes forever.

**Fix:** Break into ViewSets or separate view modules: `auth_views.py`, `chat_views.py`, `database_views.py`, `export_views.py`.

#### 2. **No Django REST Framework Serializers**
You're manually building JSON responses with dict comprehensions and helper functions like `_serialise_conversation`, `_serialise_document`, `_serialise_message`. This is reinventing the wheel poorly.

**Impact:** No input validation. No schema documentation. Inconsistent response formats.

**Fix:** Use DRF Serializers. They handle validation, documentation (via drf-spectacular), and nested relationships properly.

#### 3. **@csrf_exempt EVERYWHERE**
Almost every POST endpoint has `@csrf_exempt`. You've basically disabled CSRF protection for the entire API. Your authentication relies on session cookies with `credentials: 'include'`.

**Impact:** Vulnerable to CSRF attacks from any malicious site your users visit.

**Fix:** Use DRF's authentication classes. Configure proper CSRF handling or use token-based auth.

#### 4. **Global Mutable State in agent.py**
```python
_AGENTS: Dict[str, Any] = {}
_MEMORIES: Dict[str, MemorySaver] = {}
_CURRENT_MODEL: ModelType = DEFAULT_MODEL
```
Module-level mutable dictionaries. In a multi-worker Gunicorn setup, each worker has its own copy. Model switching affects only one worker. Memory doesn't persist across requests anyway since you use a random UUID per request.

**Impact:** Inconsistent behavior across workers. Race conditions. The MemorySaver is useless.

**Fix:** If you need shared state, use Redis or database. Accept statelessness.

#### 5. **SQLite in Production**
You explicitly limit Gunicorn to 1 worker because SQLite can't handle concurrent writes. Your comments say "PostgreSQL recommended for scale" but you haven't implemented a clean migration path.

**Impact:** Single-threaded backend. One slow request blocks everything. No horizontal scaling.

**Fix:** Switch to PostgreSQL. Your DATABASE_URL support is already there.

#### 6. **PDF Vector Store is InMemory**
```python
_vector_store: Optional[InMemoryVectorStore] = None
```
Every time you restart the server, the vector store is gone. Every PDF upload rebuilds it from scratch. With multiple workers, each worker has its own vector store.

**Impact:** Slow PDF search after restarts. Inconsistent results across workers.

**Fix:** Use a proper vector database (Pinecone, Weaviate, pgvector, Qdrant).

#### 7. **Hardcoded Secret Key in Settings**
```python
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-i^xxm##v@nuq!hzfuxejtj$kqtwnydutg7kg%8!-%*cl+b86a%')
```
That fallback secret key is in your public repo. Anyone who finds an unpatched deployment can forge sessions.

**Impact:** Session hijacking if env var is missing.

**Fix:** Fail hard if SECRET_KEY isn't set in production. Remove the default.

#### 8. **No Rate Limiting**
No throttling on any endpoint. The `/api/chat/` endpoint calls external LLM APIs. A malicious user can drain your OpenAI credits in minutes.

**Impact:** API abuse. Financial damage. DoS vulnerability.

**Fix:** Add DRF throttling or use Django-ratelimit.

#### 9. **No API Versioning**
All routes are under `/api/`. No `/api/v1/`. Breaking changes will break all clients immediately.

**Fix:** Version your API now before you have users.

#### 10. **Password Reset Token Returned in Response**
```python
return JsonResponse({
    "message": "If an account exists...",
    "resetToken": reset_token_value,
})
```
The password reset endpoint returns the token directly in the response. This bypasses email verification entirely. Anyone can reset anyone's password if they know their email.

**Impact:** Complete authentication bypass.

**Fix:** Actually send emails. Don't return the token.

### Frontend Issues

#### 1. **Massive Component Files**
- `ChatDisplay.tsx`: 766 lines
- `InputSection.tsx`: 715 lines  
- `Canvas/index.tsx`: 695 lines
- `MainPanel.tsx`: 531 lines

These are UI components, not business logic modules. Each should be 100-200 lines max.

**Impact:** Code reviews are painful. Testing is incomplete. Reusability is zero.

**Fix:** Extract subcomponents. A message bubble doesn't need to be inline JSX inside a 766-line file.

#### 2. **chatApi.ts is 800 Lines**
This file has EVERY API call. No organization. Finding the right function requires Ctrl+F.

**Fix:** Split by domain: `authApi.ts`, `chatApi.ts`, `databaseApi.ts`, `exportApi.ts`.

#### 3. **No Error Boundaries**
If any component throws during render, the whole app crashes with a white screen. React 19 has great error boundary support.

**Fix:** Add `<ErrorBoundary>` at key points.

#### 4. **No Loading Skeletons**
When data is loading, you show nothing or a simple "Loading..." text. This is 2026. Users expect skeleton UIs.

#### 5. **Inline Styles Mixed with Tailwind**
Most styling is Tailwind, but there are random inline `style={}` props scattered around.

**Fix:** Pick one approach. Stick with Tailwind.

#### 6. **No TypeScript Strict Mode Issues**
You had to add `(view as string)` type assertions to fix build errors. This indicates the types don't match your runtime behavior.

**Fix:** Fix the underlying type definitions instead of casting.

#### 7. **Speech Recognition Types are Custom**
You wrote your own `speech.d.ts` instead of using `@types/dom-speech-recognition`. And it's incomplete - `SpeechRecognitionErrorEvent` was missing.

**Fix:** Use the community types.

### Infrastructure Issues

#### 1. **No CI/CD Pipeline**
You have Ansible playbooks but no GitHub Actions, no automated testing, no deployment triggers.

**Impact:** Manual deployments are error-prone. No automated tests run before merge.

**Fix:** Add GitHub Actions for lint, test, build, deploy.

#### 2. **No Test Coverage**
- Backend: `agent/tests.py` exists but what's in it?
- Frontend: No test files visible

**Impact:** Refactoring is terrifying. Bugs are caught in production.

#### 3. **SQLite Database File Checked In**
`backend/db.sqlite3` is in the repo. This is your production database schema (and possibly data).

**Fix:** Add to `.gitignore`.

#### 4. **No Environment Separation**
Same codebase for dev and prod. `DJANGO_DEBUG` toggle is the only difference. No staging environment mentioned.

### Security Issues Summary

1. CSRF disabled globally
2. Password reset tokens returned in response (no email verification)
3. Hardcoded fallback secret key
4. No rate limiting
5. SQL queries executed directly (though user must approve, injection still possible if user approves malicious query)
6. No input sanitization on file uploads beyond extension check

### Performance Issues

1. Single Gunicorn worker (SQLite limitation)
2. InMemory vector store rebuilds on every restart
3. No caching layer (Redis)
4. PDF processing is synchronous (blocks request)
5. Large file uploads have no progress indication

---

## Feature Set

### Implemented Features

1. **Multi-Model AI Chat**
   - Gemini 2.0 Flash (default)
   - GPT-4o (requires API key)
   - Model switching via UI
   - Conversation history

2. **Document Intelligence (RAG)**
   - PDF upload
   - Vector similarity search
   - Document context injection
   - Per-conversation document management

3. **Database Connectivity**
   - SQLite file connection
   - Connection URL (PostgreSQL, MySQL)
   - Upload local SQLite files
   - Schema visualization (Mermaid diagrams)
   - SQL query execution with approval workflow
   - Query result tables
   - Export to XLSX

4. **Conversation Management**
   - Persistent history
   - Conversation titles/summaries
   - Delete with associated files
   - Export to DOCX
   - Export to ZIP (includes XLSX results and PDFs)

5. **Authentication**
   - Email/password registration
   - Session-based login
   - Password reset flow (token-based, NO EMAIL)
   - Profile management

6. **User Experience**
   - Dark mode with CSS custom properties
   - Framer Motion animations
   - Monaco SQL editor
   - Message feedback (like/dislike/report)
   - Speech-to-text input
   - Toast notifications
   - Keyboard shortcuts (Ctrl+N, Ctrl+Shift+H)

### Missing/Incomplete Features

1. **Email Integration** - Password reset doesn't send emails
2. **User Avatars** - No profile pictures
3. **Conversation Sharing** - Can't share with other users
4. **Team Workspaces** - Single-user only
5. **API Keys Management** - No way for users to bring their own keys
6. **Usage Analytics** - No tracking of token usage
7. **Streaming Responses** - Responses load all at once
8. **Conversation Search** - Can't search message content
9. **Mobile Optimization** - Responsive but not mobile-first
10. **Offline Support** - No service worker / PWA

---

## Deployment Configuration

### Environment Variables (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | YES | insecure default | Session signing key |
| `DJANGO_DEBUG` | No | False | Enable debug mode |
| `DJANGO_ALLOWED_HOSTS` | No | localhost,127.0.0.1 | Allowed hostnames |
| `DATABASE_URL` | No | None | PostgreSQL/MySQL connection |
| `SQLITE_DB_PATH` | No | db.sqlite3 | SQLite file path |
| `GOOGLE_API_KEY` | Recommended | None | Gemini API key |
| `OPENAI_API_KEY` | Recommended | None | GPT-4o + embeddings |
| `TAVILY_API_KEY` | Optional | None | Web search |
| `FRONTEND_ORIGINS` | No | localhost + Vercel URLs | CORS origins |
| `CSRF_TRUSTED_ORIGINS` | No | Same as FRONTEND_ORIGINS | CSRF origins |

### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (auto-detected in dev) |

### Ansible Variables (inventory/group_vars/)

- `webserver.yml` - Gunicorn workers, bind address
- `vault.yml` (encrypted) - API keys, secrets
- `monitoring.yml` - Nagios configuration

---

## Code Quality Metrics

| Metric | Backend | Frontend |
|--------|---------|----------|
| Total Lines | ~5000+ | ~8000+ |
| Test Coverage | Unknown (likely <10%) | 0% |
| TypeScript Strict | N/A | Partial |
| Linting | No ESLint config | eslint.config.js present |
| Documentation | Sparse docstrings | JSDoc absent |

---

## What This Application Actually Does (Plain English)

Axon is a web-based AI chatbot that can:

1. **Read your PDFs** - Upload PDFs and ask questions about them. Uses OpenAI embeddings to find relevant sections.

2. **Query your databases** - Connect to SQLite/PostgreSQL/MySQL, visualize schema, and run SQL queries. The AI suggests queries but YOU must approve them before execution.

3. **Search the web** - Uses Tavily to get real-time information when you ask about current events, weather, news.

4. **Remember conversations** - Each chat is saved with history. You can export entire conversations to Word documents or ZIP files.

5. **Switch AI models** - Toggle between Gemini and GPT-4o based on your preference (and available API keys).

The frontend is a single-page React app with a chat interface on the left and an optional SQL console panel on the right. Users must sign in to use the system (session-based auth).

---

## Recommendations (Priority Order)

### Critical (Do Before Production)
1. Fix password reset - implement email sending
2. Remove hardcoded secret key fallback
3. Add rate limiting
4. Fix CSRF protection
5. Add error boundaries to frontend

### High Priority
1. Break up views.py into modules
2. Add DRF serializers
3. Migrate to PostgreSQL
4. Add basic test coverage
5. Set up CI/CD with GitHub Actions

### Medium Priority
1. Use persistent vector store
2. Add streaming responses
3. Implement proper logging
4. Add API versioning
5. Split frontend components

### Low Priority
1. Add skeleton loading states
2. Implement conversation search
3. Add PWA support
4. Improve mobile experience

---

## Conclusion

Axon is a functional prototype with impressive features but significant technical debt. The core AI integration works. The UX is polished. But the codebase is held together with duct tape and hope.

**For a portfolio project:** Impressive scope. Shows full-stack capability.

**For production:** Not ready. Security issues. Scalability issues. Maintainability issues.

**Time to production-ready:** 2-4 weeks of focused refactoring for a skilled developer.
