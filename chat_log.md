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
