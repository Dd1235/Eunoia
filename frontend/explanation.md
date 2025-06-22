# Eunoia App (Work in Progress)

A t **study-session tracker** built with
React + TypeScript, Tailwind CSS, and Supabase (PostgreSQL + Row-Level-Security).

## 1 Project Layout

```

focus-app/
├─ /.env.example ← rename to .env.local with your keys
├─ /public
│ └─ index.html
├─ /src
│ ├─ App.tsx ← routes + global layout
│ ├─ main.tsx ← Vite entry; wraps <AuthProvider>
│ ├─ index.css ← Tailwind directives
│ │
│ ├─ components
│ │ ├─ Header.tsx
│ │ ├─ Layout/
│ │ │ └─ Container.tsx
│ │ ├─ StudyTimer/
│ │ │ ├─ StudyTimer.tsx
│ │ │ ├─ Clock.tsx
│ │ │ ├─ FinishModal.tsx
│ │ │ ├─ SleepMoodPanel.tsx
│ │ │ └─ StudyPanel.tsx
│ │ └─ Logs/
│ │ ├─ LogCard.tsx
│ │ └─ FilterBar.tsx
│ │
│ ├─ context
│ │ └─ AuthContext.tsx
│ │
│ ├─ lib
│ │ ├─ supabaseClient.ts
│ │ └─ studySleepMood.ts
│ │
│ ├─ pages
│ │ ├─ Home.tsx
│ │ ├─ Dashboard.tsx
│ │ ├─ Logs.tsx
│ │ ├─ About.tsx
│ │ ├─ Login.tsx
│ │ ├─ Signup.tsx
│ │ └─ UserProfile.tsx
│ │
│ ├─ types
│ │ └─ study.ts
│ └─ vite-env.d.ts
└─ tailwind.config.ts

```

---

## 2 Environment / Quick-start

```bash
pnpm i
cp .env.example .env.local      # fill SUPABASE_URL + SUPABASE_ANON_KEY
pnpm dev                        # Vite dev server on http://localhost:5173
```

---

## 3 Core Folders & Files

| Path                                | Exports                                                                                  | Purpose                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App.tsx**                         | default `App` component                                                                  | Wraps `<Header />`, defines routes via React Router. Protected routes are composed with `<ProtectedRoute>` (lives in `components/ProtectedRoute.tsx`, omitted above for brevity). |
| **main.tsx**                        | –                                                                                        | Bootstraps React, injects `<AuthProvider>` (Supabase session listener) and `<BrowserRouter>`.                                                                                     |
| **components/Header.tsx**           | `Header`                                                                                 | Responsive nav bar → links, theme toggle (light / dark / system), auth-aware icons. Uses `useAuth()` context + local `useState` for theme cycle.                                  |
| **components/Layout/Container.tsx** | `Container`                                                                              | **One gutter to rule them all**: `max-w-6xl` with `px-6 sm:px-4`. Every page and the header use it, ensuring perfect left-edge alignment.                                         |
| **components/StudyTimer/**          | –                                                                                        | Self-contained focus-timer module. See §4.                                                                                                                                        |
| **components/Logs/**                | `LogCard`, `FilterBar`                                                                   | **Activity feed** UI. Cards are click-toggle for notes, icons are neutral (black/white). FilterBar is a tiny controlled component with three pill buttons.                        |
| **context/AuthContext.tsx**         | `useAuth`, `AuthProvider`                                                                | Tiny wrapper around `supabase.auth.onAuthStateChange`. Exposes `{ user, loading, logout }`.                                                                                       |
| **lib/supabaseClient.ts**           | `supabase`                                                                               | Factory created via `@supabase/supabase-js`. Using `env` vars from Vite.                                                                                                          |
| **lib/studySleepMood.ts**           | `startSession`, `endSession`, `updateBreak`, `insertSleep`, `insertMood`, `fetchAllLogs` | **All DB traffic lives here**. → Each helper throws if Supabase returns an error so calling code can surface it.                                                                  |
| **pages/**                          | –                                                                                        | Conventional route components. Most are thin wrappers around component modules (e.g. `Home` just renders `<StudyPanel />`).                                                       |

---

## 4 StudyTimer Module Deep-Dive

### 4.1 `StudyTimer.tsx` (state machine)

```ts
type State =
  | { status: 'idle' }
  | { status: 'running'; id: string; start: number; breakAcc: number; breakStart: null }
  | { status: 'paused'; id: string; start: number; breakAcc: number; breakStart: number };
```

| Hook                | Why                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **`useReducer`**    | Easier to manage finite-state transitions than multiple `useState` calls (idle → running → paused). |
| **`useEffect`**     | Two intervals: one ticks elapsed time (running), the other ticks break time (paused).               |
| **`useCallback`**   | Memoises `handleStart`, `handlePause`, etc. Avoids recreating functions every render.               |
| **Custom dispatch** | Actions (`START`, `PAUSE`, `RESUME`, `RESET`) keep logic pure/testable.                             |

### 4.2 `SleepMoodPanel.tsx`

_Local form state_ → `await insertSleep / insertMood` then clears inputs.
It _ignores guests_ inside helper functions, keeping UI code simple.

### 4.3 `FinishModal.tsx`

_Headless UI_ built with native HTML; uses **Tailwind + max-height animation** for mobile scroll.
Productivity picker is a pill grid (no `<input type="range">`).

---

## 5 Database Schema (Supabase)

```sql
-- study_sessions
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  started_at timestamptz not null,
  ended_at   timestamptz,
  total_break_secs int default 0,
  productivity int,
  note text
);
-- RLS
alter table study_sessions enable row level security;
create policy study_insert on study_sessions
  for insert with check (user_id = auth.uid());
create policy study_select on study_sessions
  for select using (user_id = auth.uid());

-------------------------------------------------------
create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  date date not null,
  score int check (score between 1 and 10),
  note text,
  unique (user_id, date)
);
alter table sleep_logs enable row level security;
create policy sleep_ins on sleep_logs
  for insert with check (user_id = auth.uid());
create policy sleep_sel on sleep_logs
  for select using (user_id = auth.uid());

-------------------------------------------------------
create table mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  at timestamptz not null,
  score int check (score between 1 and 5),
  note text
);
alter table mood_logs enable row level security;
create policy mood_ins on mood_logs
  for insert with check (user_id = auth.uid());
create policy mood_sel on mood_logs
  for select using (user_id = auth.uid());
```

> **Why defaults?** > `user_id` defaults to `auth.uid()` so client never has to pass it, guaranteeing `WITH CHECK` equality.

---

## 6 Advanced Patterns & Gotchas

| Technique                   | Where                                                                                                                                                           | What to learn |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Optimistic UI refresh**   | `StudyTimer.tsx` dispatches a custom browser event `refresh-logs`; `Logs.tsx` listens and re-fetches. Shows one way to sync across routes without global state. |               |
| **Dynamic theme cycle**     | `Header.tsx` stores user preference in `localStorage`, falls back to `prefers-color-scheme`.                                                                    |               |
| **Upsert**                  | `insertSleep` uses `upsert({ onConflict: 'user_id,date' })`—great intro to Postgres _ON CONFLICT_.                                                              |               |
| **Animated disclosure**     | `LogCard` toggles `max-height`—simpler than Framer Motion for one-liner collapse.                                                                               |               |
| **RLS debugging**           | All DB helpers throw; dev console logs show `error.details` to surface policy failures quickly.                                                                 |               |
| **Container-driven layout** | One consistent gutter simplifies later design tweaks (swap `max-w-6xl` → `7xl` once).                                                                           |               |

---

## 8 Scripts

| Command        | Description                     |
| -------------- | ------------------------------- |
| `pnpm dev`     | Vite dev server                 |
| `pnpm lint`    | ESLint (Airbnb + TS + Prettier) |
| `pnpm build`   | Production build (`/dist`)      |
| `pnpm preview` | Serve the built app locally     |

---

## 9 Troubleshooting RLS

1. Network 403 → check response JSON for `"details"`.
2. Run `select * from pg_policies where tablename='study_sessions'` to list active policies.
3. Confirm the `user_id` column has `default auth.uid()`.

> **Tip:** always keep _one_ policy per `cmd` (INSERT/SELECT/UPDATE/DELETE) to avoid conflicts.
