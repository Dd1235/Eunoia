-- Create the todos table
create table "public"."todos" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null,
  "content" text not null,
  "done" boolean default false,
  "created_at" timestamp with time zone default now()
);

-- Enable RLS
alter table "public"."todos" enable row level security;

-- Grant only to authenticated + service role
grant all on table "public"."todos" to authenticated, service_role;

-- Secure RLS Policies
-- Select only your own todos
create policy "Todos: Select own" on "public"."todos"
as permissive for select to authenticated
using (auth.uid() = user_id);

-- Insert only for yourself
create policy "Todos: Insert own" on "public"."todos"
as permissive for insert to authenticated
with check (auth.uid() = user_id);

-- Update only your own todos
create policy "Todos: Update own" on "public"."todos"
as permissive for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Delete only your own todos
create policy "Todos: Delete own" on "public"."todos"
as permissive for delete to authenticated
using (auth.uid() = user_id);
