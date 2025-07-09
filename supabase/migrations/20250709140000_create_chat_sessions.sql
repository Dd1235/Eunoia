-- Migration: Create chat_sessions table for chatbot logs/history
CREATE TABLE IF NOT EXISTS chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    logs jsonb NOT NULL,
    history jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Only keep one session per user: enforce unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_chat_session ON chat_sessions(user_id);

-- RLS: Only allow users to access their own chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own chat sessions" ON chat_sessions
    USING (user_id = auth.uid()); 