# Axon Frontend

A modern React-based frontend for the Axon AI-Powered Document & Database Intelligence Platform.

## 🚀 Features

- **Multi-Model AI Chat** – Interact with Gemini 2.0 Flash or GPT-4o
- **Document Upload** – PDF upload with drag-and-drop support
- **Database Connectivity** – Connect to external SQL databases or upload SQLite files
- **Schema Visualization** – Interactive Mermaid diagrams for database schemas
- **SQL Query Editor** – Monaco Editor with syntax highlighting
- **Export Options** – Export conversations to DOCX/ZIP, SQL results to XLSX
- **Message Actions** – Copy, like, dislike, report messages with source citations
- **Smooth Animations** – GSAP hero treatments and Framer Motion transitions

## ��️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **TailwindCSS 4** | Styling |
| **Framer Motion** | Animations |
| **GSAP** | Hero animations |
| **Monaco Editor** | SQL query editor |
| **Mermaid** | Database schema diagrams |

## 📦 Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

# Start development server
npm run dev
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
├── public/              # Static assets (images, icons)
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx              # Login/Register modal
│   │   ├── Canvas.tsx                 # SQL results & schema view
│   │   ├── ChatDisplay.tsx            # Message rendering with actions
│   │   ├── DatabaseConnectionModal.tsx # DB connection form
│   │   ├── InputSection.tsx           # Chat input with file upload
│   │   ├── MainPanel.tsx              # Main content area with settings
│   │   ├── SchemaDiagram.tsx          # Mermaid schema visualization
│   │   └── Sidebar.tsx                # Conversation list
│   ├── services/
│   │   └── chatApi.ts                 # API client (auth, chat, export)
│   ├── types/
│   │   ├── mermaid.d.ts
│   │   └── speech.d.ts
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json                        # Vercel deployment config
```

## 🎨 Design System

- **Primary Color**: `#2563eb` (Blue-600)
- **Background**: Dark theme with slate tones
- **Font**: System font stack
- **Animations**: Smooth transitions with Framer Motion

## 🔗 Backend Integration

The frontend communicates with the Django backend API. Ensure the backend is running at the configured `VITE_API_BASE_URL`.

### Key API Endpoints Used

- `/auth/*` – Authentication (login, register, logout)
- `/chat/` – Send messages
- `/conversations/*` – Manage conversations
- `/documents/*` – Manage uploaded documents
- `/database/*` – Database operations
- `/models/*` – AI model selection

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

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
