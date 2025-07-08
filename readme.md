# Eunoia Project Structure and Technical Overview

## Backend

- **Framework:** FastAPI (Python)
- **Location:** `backend/`

### Key Folders and Files

- `app/` - Main FastAPI application code
  - `api/` - API endpoints for chat, meditation, and dependencies
  - `core/` - Configuration and logging utilities
  - `models/` - Pydantic and DB models (e.g., chat session)
  - `services/` - Business logic
    - `agents/` - Agent logic for OpenAI/Gemini (modular, ready for LLM integration)
    - `meditation.py` - Handles meditation prompt, transcript, TTS, and Supabase upload
    - `supabase_client.py` - Reusable Supabase client
    - `session_store.py` - In-memory session management
    - `supabase_logs.py` - Log fetching from Supabase
- `static/audios/` - Preset background audio files for meditation
- `generated_audios/` - Locally generated meditation audio (for development/testing, this was when audios were being served using fastapi instead of using supabase storage)
- `requirements.txt` - Python dependencies

### Data Storage

- **Logs and chat sessions:** Currently stored in memory or local files for development. Meditation audio and metadata are stored in Supabase Storage and DB.
- **No todo AI agent yet.**

## Frontend

- **Framework:** React (TypeScript, Vite, TanStack Query, TailwindCSS)
- **Location:** `frontend/`

### Key Folders and Files

- `src/components/` - Modular UI components
  - `TodoList/` - Todo list, drag-and-drop, and quick note components
  - `UserProfile/` - Goals management UI
  - `Meditate/` - Meditation generation and playback
  - `ui/` - Reusable UI primitives (button, card, accordion, etc.)
  - `Layout/` - Layout containers
- `src/pages/` - Top-level pages (Dashboard, TodoList, MeditateWithAI, UserProfile, etc.)
- `src/hooks/` - Custom hooks for todos, goals, logs, chat, etc.
- `src/types/` - Shared TypeScript types (todo, meditate, user, study)
- `src/lib/` - Utility and API client code (Supabase, session, study/sleep/mood logic)
- `src/assets/` - Audio and image assets
- `public/` - Static files and images
- `global.css` - Tailwind and global styles

### State and Data

- Uses TanStack Query for all data fetching, caching, and optimistic updates
- Session and log state is cached in sessionStorage for fast navigation
- All authentication and user management via Supabase Auth

## Supabase

- **Location:** `supabase/`
- **Purpose:** Database, authentication, storage, and migrations

### Key Folders and Files

- `migrations/` - SQL migrations for all tables (todos, meditations, goals, logs, etc.)
- `config.toml` - Supabase project configuration
- `.temp/` - Supabase CLI temp files

### Notable Tables

- `todos` - User todos with priority ordering
- `meditations` - Meditation transcripts and audio URLs
- `long_term_goals`, `short_term_goals` - User goals
- `free_notes` - Quick notes
- `study_sessions`, `sleep_logs`, `mood_logs` - User logs

## Notable Problems and Solutions

### Todo Priority and Drag-and-Drop

- **Problem:** Maintaining unique, gapless priorities for todos with drag-and-drop and insertions led to duplicate key errors and race conditions.
- **Solution:**
  - Used a two-phase SQL function to shift all priorities by +1000, then renumber starting at 2, leaving slot 1 free for new inserts.
  - All reordering and inserts happen inside a single SQL transaction to avoid unique constraint violations.
  - Optimistic UI updates and pointer event guards prevent drag-and-drop from interfering with checkbox and delete actions.

### React Hook Order Violation

- **Problem:** Conditional hook calls in the logs page caused React errors.
- **Solution:** All hooks are now called unconditionally at the top of each component. Data fetching is handled by TanStack Query with proper `enabled` flags.

### Session and Log Caching

- **Problem:** Session and log state was cached in sessionStorage for fast navigation, but this led to stale data if new logs were added.
- **Solution:** Switched to TanStack Query for all log fetching and caching, with invalidation on mutation.

### General

- All authentication is handled by Supabase JWTs.
- Meditation audio is stored in Supabase Storage, not on the server.
- The backend is ready for LLM agent integration but currently uses in-memory or local storage for logs and chat sessions.

## Folder Overview

### backend/

- FastAPI app, business logic, static and generated audio, requirements

### frontend/

- React app, modular components, hooks, types, assets, pages, global styles

### supabase/

- Database migrations, config, and project files

---

For more technical details, see the code and migration files in each folder.
