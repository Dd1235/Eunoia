# Eunoia Project: Chat/Logs/Agent Integration Summary (as of 05-07-2025)

## FRONTEND

- **Authentication:**

  - Uses Supabase Auth for user sign-in and user ID management.
  - Only authenticated users can access /dashboard, /logs, and /meditate.

- **Logs (Study, Sleep, Mood):**

  - Users can log study sessions, sleep, and mood.
  - Logs are fetched from Supabase and displayed in a unified /logs page.
  - Only the last 2 weeks of logs are shown by default for performance.
  - Log type toggles (study/sleep/mood) are styled as rounded buttons, with dark/light theme support.
  - Logs and UI state (which logs are shown) are cached in sessionStorage for instant reloads and persistence across navigation.

- **Chat/Agent Panel:**

  - Chat panel is shown alongside logs in a responsive split layout.
  - Uses a React Context Provider (`ChatSessionProvider`) to persist chat session ID, chat history, and log type configuration across the app.
  - Chat history and log config are also cached in sessionStorage for persistence across navigation.
  - When the user sends a message, the frontend:
    - Starts a chat session with the backend (if not already started), sending the Supabase user ID.
    - Sends each message to the backend with the session ID, user ID, and the user's logs as context.
    - Shows a loading indicator if the agent is "processing context" (first message).

- **Technical React Details:**
  - Uses React Context for global state (chat session, history, log config).
  - Uses custom hooks (e.g., `useLogs`) for fetching and caching logs.
  - Uses sessionStorage for fast, persistent state between page switches.
  - All UI is responsive and dark-mode friendly.

## BACKEND (FastAPI + Python)

- **Session Management:**

  - `/chat/session` (POST): Starts a new chat session, returns a session ID. Stores session in memory, keyed by user ID.
  - `/chat/message` (POST): Receives session ID, user ID, message, and logs. Maintains chat history in memory for the session.
  - First message simulates a delay ("agent is going through your logs..."). Subsequent messages are instant.
  - For production, session and chat history should be stored in a database or Redis.

- **Agent Integration:**

  - (Current POC) Dummy agent replies, but the backend is ready to call a real agent (e.g., OpenAI GPT-3.5 Turbo) using the logs as context.
  - The agent can use the logs sent from the frontend to provide personalized responses.

- **Supabase/Postgres Integration:**

  - Uses Supabase as the main database for logs and user authentication.
  - `/dbinfo` endpoint connects directly to the Postgres DB (via psycopg2) to provide a schema summary for documentation/logging.

- **Audio/Meditation Generation:**
  - `/generate-meditation/` endpoint generates meditation audio using TTS and background music (not directly related to chat, but part of the app).

## SESSION & CONTEXT FLOW

- User logs in (Supabase Auth) and opens /logs.
- Frontend fetches logs and starts a chat session with the backend, sending the user ID.
- When the user sends a message, the frontend sends the message, session ID, user ID, and logs to the backend.
- Backend agent can use the logs and chat history to generate a response.
- All state (chat, logs, config) is persisted in sessionStorage for a seamless UX.

## NEXT STEPS

1. **Agent Integration:**
   - Replace dummy agent with a real LLM (e.g., OpenAI GPT-3.5 Turbo) in the backend.
   - Pass user logs as context to the agent for personalized suggestions.
2. **Persistent Chat Storage:**
   - Move chat session/history storage from in-memory to a database (Postgres or Redis) for reliability and scaling.
3. **Production Hardening:**
   - Add authentication to backend endpoints (e.g., verify Supabase JWTs).
   - Add error handling, rate limiting, and logging.
4. **Tooling for Agent:**
   - Optionally, let the agent call Supabase MCP server or other APIs as "tools" for more advanced context.
5. **UI/UX Polish:**
   - Add typing indicators, better error messages, and polish chat/agent UI.
6. **Testing:**
   - Write integration tests for chat flow, session management, and agent responses.

some more log dumping

Work in Progress

Remarks: I am storing the logs in session storage (ps direct communication iwth supabase backend, fastapi backend is separate from this, in case the ai chat is down, the logs would still be independent of that), the reason for storing in session storage is to avoid loading again and again if you change pages while on the same website.

But that means that if you add a new log, it will be reflected in the database, but not /logs,
refreshing also won't update since it will fetch from session storage, can simply remove session storage, or need to find a way to have smarter caching.

Closing and reopening tab should update the logs

Could've used cloud firestore, bonus google points, but I wanted to use a relational database. Already used mongodb for edureach, and had DBMS last semester, so wanted to put those sql skills to use.

Using react query, need to learn it better.
Was using useEffects and the typical flow for Edureach

I LOVE SUPABASE!!!

OAuth login signup in two lines of code!!

7th July log

In a todo list where a priority field is used to define display order, maintaining a gapless and strictly increasing sequence (1, 2, 3, ...) can introduce complexity when handling inserts, deletions, and reordering. One approach is to consistently insert new items at the top with priority = 1, shifting all other items down by incrementing their priorities. This ensures the newest items appear at the top while preserving order semantics. When a todo is deleted, the resulting gap in the sequence does not impact functionality, as the UI continues to sort by priority. Gaps are harmless and only become a concern if strict contiguity is required, such as when hitting a maximum item limit or for clean index management. In such cases, priorities can be rebalanced lazily during drag-and-drop reordering by reassigning them from 1 to N in visual order. This strategy works well under the assumption that each user maintains a relatively small number of todos (e.g., ≤50), making the occasional full reordering operation efficient, while avoiding the overhead of rebalancing on every insert or delete.

---

## What went wrong — timeline

| Step  | Action                                                                                                                                              | Result                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **1** | Added UNIQUE index `(user_id, priority)`                                                                                                            | Any momentary duplicate priority → `23505` error   |
| **2** | Original client logic updated rows **one-by-one**                                                                                                   | Drag-drop & insert both crashed (`duplicate key…`) |
| **3** | We introduced a “two-phase” SQL fix:<br>   • shift `+1000` → renumber **1…N**                                                                       | Drag-drop now safe ✔️                              |
| **4** | **Insert** still failed: renumbering back to **1** left **no free slot** for the new row (we insert `priority = 1`, clashing with the old top item) | `23505` persists on **add todo**                   |

### 1 Replace `increment_priorities_for_user` with **“leave slot #1 free”** version

```sql
create or replace function increment_priorities_for_user(uid uuid)
returns void
language plpgsql
as $$
begin
  -- Phase A: move everyone far away
  update todos
     set priority = priority + 1000
   where user_id = uid;

  -- Phase B: renumber back starting at **2** (so 1 is free)
  with ranked as (
       select id,
              row_number() over (order by priority) + 1  -- note **+1**
                as new_p
         from todos
        where user_id = uid
  )
  update todos t
     set priority = ranked.new_p
    from ranked
   where t.id = ranked.id;
end;
$$;
```

_Outcome:_ after the function runs, all existing todos are `2, 3, 4…`, leaving
`1` vacant for the incoming todo ⇒ **no duplicate**.

### 2 Client code stays almost identical

You already changed the call signature (`ordered_ids`).
The only thing to verify is that **`addTodo`** still calls this RPC before the
`insert` (it does):

```ts
await supabase.rpc("increment_priorities_for_user", { uid: user!.id });
await supabase.from("todos").insert({
  content,
  user_id: user!.id,
  priority: 1, // now guaranteed unique
});
```

### 3 (One-off) wipe any lingering duplicates

If previous crashes left duplicates, run once in SQL console:

```sql
with ranked as (
  select id,
         row_number() over (partition by user_id order by priority) as new_p
    from todos
)
update todos t
   set priority = ranked.new_p
  from ranked
 where t.id = ranked.id;
```

-- Call the function once for that user
SELECT increment_priorities_for_user('2186bc0f-cc85-4d97-b066-39c625aff1f4'::uuid);

Problem: Inserting a new todo at priority 1 violated the `(user_id, priority)` unique index, resulting in duplicate-key errors.
Solution: Run `increment_priorities_for_user` first, which shifts every row by +1000 then renumbers back starting at 2, leaving slot 1 free.

Problem: Drag-and-drop sent `"["id1","id2"]"` (a JSON string), so `jsonb_array_elements_text()` threw “cannot extract elements from a scalar”.
Solution: Pass the raw array (no `JSON.stringify`) so Postgres receives a real `jsonb` array.

Problem: Subsequent reorder still hit duplicate priorities.
Solution: Use three-phase SQL (`+1000`, set new 1…n, then compact leftovers) so the unique index is never violated inside the transaction.

Problem: Optimistic placeholder ids like `optimistic-123` failed `(value)::uuid` casts.
Solution: Generate syntactically correct UUIDs with `crypto.randomUUID()` or filter non-UUIDs before the RPC.

Problem: Checkbox clicks sometimes started a drag and the UI “snapped back”.
Solution: Use `onPointerDown(e ⇒ e.stopPropagation())` on the checkbox/button plus an optimistic cache flip in `toggleTodo` to hide latency.

Problem: Delete button was swallowed by DnD too.
Solution: Use the same pointer guard.

Problem: Cache briefly showed stale order/content after any mutation.
Solution: Use TanStack Query’s `onMutate / onError / onSuccess` pattern for all write paths.

onMutate: optimistically update the cache with the new state.
onError: revert the cache to the previous state if the mutation fails.
onSuccess: Ensure the cache reflects the final state after a successful mutation.

Overall learning: Keep priorities dense only when needed (lazy re-balance during reorder), pass pure JSONB not double-stringified data, guard pointer events when mixing DnD with clicks, ensure every write happens inside a single SQL transaction (stored procedure) to satisfy the unique constraint at all intermediate steps, and always add an optimistic UI layer for a snappy experience.

Here’s the full log in plain text, ready to paste into your `README.md` or documentation file:

---

Log: React Hook Order Violation in `/logs` Page

Problem:
React threw the following error on the `/logs` page:

```
Error: Rendered more hooks than during the previous render.
Warning: React has detected a change in the order of Hooks called by Logs.
```

Problem Code:

```tsx
if (!user) return <p>Log in</p>;
const { data: logs, isLoading } = useLogs(); // Hook conditionally skipped
```

Root Cause:
In React, all hooks (like `useState`, `useEffect`, `useQuery`, etc.) must be called in the **same order on every render**. If a hook is conditionally skipped—such as after an early `return`—React will detect the mismatch and throw an error.

In this case, we also had a utility `useRestoreSession()` function containing a `useEffect()` that was called **after** checking for the user. This meant the hook inside `useRestoreSession()` was not run consistently, causing the hook order to differ between renders.

---

Solution:

1.  Move all hook calls—including `useLogs()` and `useRestoreSession()`—**above any conditional `return`** statements.
2.  Rewrote `useLogs()` using [TanStack Query](https://tanstack.com/query/latest) to handle fetching, caching, and invalidation automatically.
3.  Eliminated the old sessionStorage-based log state.

---

New `useLogs()` (using TanStack Query):

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export const useLogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["logs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 15);

      const [study, sleep, mood] = await Promise.all([
        supabase
          .from("study_sessions")
          .select("*")
          .gte("started_at", since.toISOString())
          .order("started_at", { ascending: false }),
        supabase
          .from("sleep_logs")
          .select("*")
          .gte("date", since.toISOString().slice(0, 10))
          .order("date", { ascending: false }),
        supabase
          .from("mood_logs")
          .select("*")
          .gte("at", since.toISOString())
          .order("at", { ascending: false }),
      ]);

      return {
        study: study.data ?? [],
        sleep: sleep.data ?? [],
        mood: (mood.data ?? []).map((m) => ({
          ...m,
          formatted: new Date(m.at).toLocaleString(),
        })),
      };
    },
  });
};
```
