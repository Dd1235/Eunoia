-- Migration: Create `free_notes` table to store per-user scratchpad notes

create table if not exists free_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null default 'default',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Enforce: One note per user per tag (e.g., one scratchpad note per section)
alter table free_notes
add constraint unique_user_tag_combo unique (user_id, tag);

-- Index for faster lookup
create index if not exists idx_free_notes_user_id_tag
  on free_notes (user_id, tag);

--s Enable Row Level Security
alter table free_notes enable row level security;

-- RLS Policy: Users can read/write only their own notes
create policy "Users can access their own notes"
on free_notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);