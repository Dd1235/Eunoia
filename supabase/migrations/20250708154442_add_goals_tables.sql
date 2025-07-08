-- Add long_term_goals table
CREATE TABLE IF NOT EXISTS public.long_term_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    goal text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_long_term_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add short_term_goals table
CREATE TABLE IF NOT EXISTS public.short_term_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    goal text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_short_term_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- No rows inserted for existing users; tables start empty. 