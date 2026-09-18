# React 19 Full-Stack Template | قالب تطبيق متكامل

**A learning template for building production-ready applications**

This is the starter template for the Udemy course: **Learn React.js 19 with Cursor**

## About This Template

This template provides a clean, lean structure to help you learn how to build a modern, production-ready full-stack application from the ground up. Throughout the course, we'll build an AI-powered note-taking application with bilingual support (English/Arabic), authentication, and AI features.

The structure is intentionally simple and focused on learning best practices for:
- Modern React 19 development
- Full-stack TypeScript architecture  
- Authentication and security
- AI integration
- Internationalization and accessibility
- Production deployment strategies

### What You'll Learn to Build

Throughout the course, you'll implement these production-ready features:

- 🔐 **Secure Authentication** - Learn Clerk-based authentication patterns
- 📝 **Notes Management** - Master full CRUD operations with TypeScript
- 🤖 **AI Integration** (OpenAI GPT-5-mini):
  - **Summarize** - Generate intelligent summaries
  - **Rewrite** - Improve text with 4 different modes
  - **Translate** - Translate between English and Arabic
- 🌍 **Internationalization** - Implement bilingual support with react-intl
- ↔️ **RTL/LTR Support** - Handle bidirectional text properly
- 🎨 **Modern UI** - Build responsive interfaces with Tailwind CSS v4
- 🔄 **State Management** - Learn React 19 patterns and best practices
- 🛡️ **Security** - Implement proper authentication and authorization
- 🚀 **Deployment** - Prepare applications for production

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: Clerk (token verification)
- **Validation**: Zod
- **AI**: OpenAI GPT-5-mini

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4
- **i18n**: react-intl with RTL support

## Project Structure

```
maswada-ai/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── config/    # Environment configuration
│   │   ├── db/        # Database setup and sync
│   │   ├── models/    # Sequelize models
│   │   ├── middlewares/ # Auth, error handling
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic (notes, ai, openai)
│   │   ├── validators/ # Zod schemas
│   │   ├── app.ts     # Express app setup
│   │   └── server.ts  # Server entry point
│   └── package.json
│
├── frontend/          # React application
│   ├── src/
│   │   ├── app/       # Application core
│   │   │   ├── App.tsx      # Main app component with routing
│   │   │   ├── layout/      # Layout components (Header, Footer, AppLayout)
│   │   │   └── pages/       # Page components
│   │   ├── components/      # Reusable components
│   │   │   ├── common/      # Common components (GlassCard)
│   │   │   └── ui/          # UI library components
│   │   ├── lib/       # Utilities
│   │   ├── assets/    # Static assets
│   │   ├── main.tsx   # Entry point
│   │   └── index.css  # Global styles
│   └── package.json
│
└── README.md          # This file
```

## Prerequisites

Before starting the course, ensure you have:

- Node.js 18+ and npm installed
- A code editor (we recommend Cursor)
- A Clerk account (free tier works)
- An OpenAI API key (for AI features)
- Basic knowledge of JavaScript/TypeScript and React

## Quick Start

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your CLERK_SECRET_KEY
   ```

4. Initialize database:
   ```bash
   npm run db:sync
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your VITE_CLERK_PUBLISHABLE_KEY
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:5173`

### ✅ Phase A: Backend Foundation
**Status**: COMPLETED ✓

- [x] Express.js setup with TypeScript
- [x] Environment configuration (Clerk + OpenAI)
- [x] Sequelize + SQLite setup
- [x] Database models (Note)
- [x] Error handling middleware
- [x] CORS configuration
- [x] Database sync script ready

**Files**: `backend/src/{app.ts, server.ts, config/, db/, middlewares/errorHandler.ts}`

---

### ✅ Phase B: Authentication Middleware
**Status**: COMPLETED ✓

- [x] Clerk SDK installed
- [x] Auth middleware structure
- [x] Token verification implementation with Clerk SDK
- [x] Extract userId from JWT
- [x] Protect routes with auth middleware
- [x] Handle auth errors (401/403, expired tokens)
- [x] Test endpoint (`GET /api/auth/me`)

**Files**: `backend/src/middlewares/auth.ts`, `backend/src/routes/auth-test.ts`

**Completed**: Real JWT verification using `clerkClient.verifyToken()`. All protected routes now require valid Clerk authentication.

---

### ✅ Phase C: Notes CRUD + Validation
**Status**: COMPLETED ✓ (Ready for Testing with Frontend)

- [x] Zod validation schemas
- [x] Notes service layer
- [x] Notes routes (GET, POST, PATCH, DELETE)
- [x] userId scoping implemented in service layer
- [x] All endpoints protected by auth middleware

**Files**: `backend/src/{routes/notes.ts, services/notes.service.ts, validators/notes.schema.ts}`

**Testing Guide**: See `backend/TESTING.md` for API testing instructions.

---

### ✅ Phase D: AI Endpoints + OpenAI Integration
**Status**: COMPLETED ✓

- [x] OpenAI service with GPT-5-mini
- [x] AI service layer
- [x] AI routes (summarize, rewrite, translate)
- [x] Zod validation for AI requests
- [x] Direct OpenAI SDK integration (no abstraction needed)

**Files**: `backend/src/{routes/ai.ts, services/ai.service.ts, services/openai.service.ts, validators/ai.schema.ts}`

**Completed**: Using GPT-5-mini for all AI features. Ready to test once auth is implemented.

---

### ✅ Phase E: Frontend Routing + Clerk Integration
**Status**: COMPLETED ✓

- [x] Vite + React setup
- [x] Tailwind CSS v4 configuration
- [x] React Router v7 setup with routes
- [x] Clerk provider integration
- [x] Protected routes implementation
- [x] Layout components with navigation
- [x] Sign-in/sign-out buttons

**Files**: `frontend/src/{App.tsx, components/layouts/, components/auth/}`

---

### ✅ Phase F: Notes UI + API Integration
**Status**: COMPLETED ✓

- [x] API client with Clerk token integration
- [x] NotesPage with list, delete functionality
- [x] CreateNotePage with form validation
- [x] NoteDetailPage with edit capability
- [x] AI features integration (summarize, translate)
- [x] Loading and error states throughout

**Files**: `frontend/src/{lib/api-client.ts, hooks/useApiClient.ts, pages/}`

---

### ✅ Phase G: Internationalization (i18n) + RTL
**Status**: COMPLETED ✓

- [x] LocaleContext setup
- [x] Message structure (EN/AR)
- [x] Comprehensive translation messages for all UI text
- [x] Integrate react-intl
- [x] Language switcher component in header
- [x] RTL/LTR styling with `dir` attribute
- [x] All pages translated (Home, Notes, Create, Detail)
- [x] FormattedMessage components throughout

**Files**: `frontend/src/{contexts/LocaleContext.tsx, i18n/messages.ts, components/LanguageSwitcher.tsx}`

---

### ✅ Phase H: AI Features UI + Polish
**Status**: COMPLETED ✓

- [x] AI feature buttons in note detail page
- [x] Summarize note UI with translated button
- [x] Rewrite note with 4 mode selection (clearer, shorter, formal, casual)
- [x] Translate note between EN/AR
- [x] Display AI results with styled containers
- [x] Handle AI errors gracefully
- [x] Loading states for AI operations
- [x] Responsive design with flex-wrap
- [x] Dropdown menu for rewrite modes
- [x] Fully translated UI

**Files**: `frontend/src/pages/NoteDetailPage.tsx`

---

## API Documentation

### Public Endpoints

- `GET /health` - Health check

### Protected Endpoints (require Bearer token)

#### Notes
- `GET /api/notes` - List all notes for user
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get single note
- `PATCH /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

#### AI Features
- `POST /api/ai/summarize` - Summarize text or note
  ```json
  { "noteId": "uuid" | "text": "content" }
  ```

- `POST /api/ai/rewrite` - Rewrite text in different style
  ```json
  { 
    "noteId": "uuid" | "text": "content",
    "mode": "shorter" | "clearer" | "formal" | "casual"
  }
  ```

- `POST /api/ai/translate` - Auto-detect and translate (EN↔AR)
  ```json
  { 
    "noteId": "uuid" | "text": "content"
  }
  ```

## Data Model

### Note
```typescript
{
  id: string;           // UUID
  userId: string;       // Clerk user ID
  title: string;
  content: string;
  language: 'en' | 'ar';
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Development Guidelines

### Backend
- All routes must verify Clerk tokens
- All database queries must filter by `userId`
- Use Zod for request validation
- Centralized error handling
- Keep business logic in service layer

### Frontend
- Use TypeScript strictly
- All API calls through `apiClient`
- Protected routes require authentication
- Support both EN/AR in all UI
- Responsive design (mobile-first)
- Accessible components

## Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SQLITE_PATH=./data/maswada.db
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION_ID=org-...  # Optional
```

### Frontend (.env)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3001
```

## Production Deployment

### Backend
1. Build TypeScript: `npm run build`
2. Set production environment variables
3. Run database sync: `npm run db:sync`
4. Start server: `npm start`

### Frontend
1. Build for production: `npm run build`
2. Serve `dist/` directory with static file server
3. Ensure environment variables are set at build time

## Learning Approach

This template includes a phased implementation plan (Phases A-H) that guides you through building the application step by step. Each phase builds upon the previous one, teaching you how to architect and implement a real-world application.

**What You'll Build:**
- Full-stack note-taking application with AI features
- Secure authentication system
- RESTful API with Express.js
- Modern React 19 frontend
- Bilingual support (English/Arabic)
- AI integration with OpenAI

## License

MIT

---

**Getting Started:**

Follow along with the Udemy course **Learn React.js 19 with Cursor** to build this application from scratch. The template provides the foundation - you'll implement the features through guided lessons.

**Course Repository:** Use this template to start your own project and follow the implementation phases outlined above.
