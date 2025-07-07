-- Add meditations table for storing generated meditations
CREATE TABLE IF NOT EXISTS public.meditations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    transcript text NOT NULL,
    audio_url text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_meditations_user_id ON public.meditations(user_id); 