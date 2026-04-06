# Axon Frontend

A modern React + Vite frontend for the Axon AI-Powered Document & Database Intelligence Platform.

## 🚀 Features

- **Multi-model AI chat** with model selection and conversational history
- **Document upload** for PDF files and contextual document search
- **Database connectivity** with SQL query execution, schema browsing, and SQLite upload
- **Schema visualization** using Mermaid diagrams
- **SQL query editing** in Monaco Editor with export support
- **Export options** for conversations to DOCX/ZIP and SQL results to XLSX
- **Message actions** including copy, like/dislike, and citation links
- **Smooth UI transitions** using Framer Motion

## 🧰 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **TailwindCSS 4** | Styling |
| **Framer Motion** | UI animations |
| **Monaco Editor** | SQL query editor |
| **Mermaid** | Database schema diagrams |

## 📦 Installation

```bash
cd frontend
npm install
npm run dev
```

If you want to override the backend URL, add a `.env` file in `frontend/` with:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 📁 Project Structure

```
frontend/
├── public/                  # Static assets and favicon
├── src/
│   ├── components/          # UI components and feature screens
│   │   ├── Canvas/
│   │   │   ├── CanvasPanel.tsx
│   │   │   ├── SchemaDiagram.tsx
│   │   │   ├── SqlHistoryPanel.tsx
│   │   │   ├── SqlPendingApprovalPanel.tsx
│   │   │   ├── SqlResultsView.tsx
│   │   │   ├── SqlSuggestionsPanel.tsx
│   │   │   └── types.ts
│   │   ├── chat/
│   │   │   ├── AssistantMessage.tsx
│   │   │   ├── ChatDisplay.tsx
│   │   │   ├── ChatView.tsx
│   │   │   ├── InputSection.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   ├── MessageActions.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── ScrollToBottom.tsx
│   │   │   ├── SourceBadges.tsx
│   │   │   ├── SqlBlock.tsx
│   │   │   ├── SqlResultsInline.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── UserMessage.tsx
│   │   ├── command/
│   │   │   └── CommandPalette.tsx
│   │   ├── documents/
│   │   │   └── DocumentsView.tsx
│   │   ├── errors/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── NotFound.tsx
│   │   ├── input/
│   │   │   └── ChatInput.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── MainPanel.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── library/
│   │   │   ├── ConversationCard.tsx
│   │   │   └── LibraryView.tsx
│   │   ├── modals/
│   │   │   ├── AuthModal.tsx
│   │   │   └── DatabaseConnectionModal.tsx
│   │   ├── settings/
│   │   │   └── SettingsView.tsx
│   │   ├── skeletons/
│   │   │   └── PageSkeletons.tsx
│   │   └── ui/
│   │       └── ToastContainer.tsx
│   ├── config/
│   │   └── api.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useAuth.ts
│   │   ├── useConversationManager.ts
│   │   ├── useDatabaseSettings.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useSqlConsole.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── chatApi.ts
│   │   ├── chatService.ts
│   │   ├── databaseService.ts
│   │   ├── documentService.ts
│   │   ├── feedbackService.ts
│   │   ├── graphService.ts
│   │   ├── http.ts
│   │   └── modelService.ts
│   ├── stores/
│   │   ├── AuthProvider.tsx
│   │   ├── chatStore.ts
│   │   ├── databaseStore.ts
│   │   ├── ThemeProvider.tsx
│   │   └── ToastProvider.tsx
│   ├── styles/
│   │   ├── animations.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── glass.css
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   └── utilities.css
│   ├── types/
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── common.ts
│   │   ├── database.ts
│   │   ├── documents.ts
│   │   ├── graph.ts
│   │   ├── mermaid.d.ts
│   │   ├── models.ts
│   │   └── speech.d.ts
│   ├── utils/
│   │   ├── chatMappers.ts
│   │   ├── formatters.ts
│   │   ├── sql.ts
│   │   ├── sqlUtils.ts
│   │   └── theme.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vercel.json              # Vercel deploy config
```

## 🎨 Design System

- **Primary Color**: `#2563eb` (Blue-600)
- **Background**: Dark theme with slate tones
- **Font**: System font stack
- **Animations**: Smooth transitions with Framer Motion

## 🔗 Backend Integration

The frontend communicates with the Axon Python backend API over the `/api` prefix. By default, the app resolves to `http://localhost:8000/api` in development.

### Key API Endpoints Used

- `/auth/*` – Authentication endpoints (register, login, logout, profile)
- `/chat/` – Conversational AI requests
- `/conversations/*` – Conversation history and exports
- `/documents/*` – Document upload, listing, download, and deletion
- `/database/*` – Database connection, query, schema, and export
- `/models/*` – AI model listing and selection

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

If `VITE_API_BASE_URL` is not set, the frontend defaults to `http://localhost:8000/api` during development and `window.location.origin/api` in production.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_API_BASE_URL=https://your-backend-url/api`
3. Deploy

The `vercel.json` is pre-configured for SPA routing.

### Manual Build

```bash
npm run build
# Deploy the `dist/` folder to your static hosting
```

## 📝 License

Part of the Axon project. See main project license for details.
