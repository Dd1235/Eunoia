-- sleep logs
create table sleep_logs (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id),
date date not null, -- YYYY-MM-DD
score int check (score between 1 and 10),
note text
);
alter table sleep_logs enable row level security;
create policy "sleep owner" on sleep_logs
for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

-- mood logs
create table mood_logs (
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id),
at timestamptz not null,
score int check (score between 1 and 5),
note text
);
alter table mood_logs enable row level security;
create policy "mood owner" on mood_logs
for all using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );

alter table sleep_logs add constraint uniq_sleep unique (user_id, date);

-- ─────────────────────────────────────────────────────────────
-- sleep_calendar (>= 8/10)
-- ─────────────────────────────────────────────────────────────
create or replace function public.sleep_calendar(
\_uid uuid,
\_days int default 30
)
returns table(dt date, good boolean)
language sql
security definer
set search_path = public
as

$$

select
date as dt,
score >= 8 as good
from sleep_logs
where user_id = \_uid
and date >= current_date - (\_days - 1);


$$

;

comment on function public.sleep_calendar is
'Returns one row per day with a boolean showing if sleep score ≥ 8/10';

-- ─────────────────────────────────────────────────────────────
-- study_calendar (≥ 120 min net study)
-- ─────────────────────────────────────────────────────────────
create or replace function public.study_calendar(
\_uid uuid,
\_days int default 30
)
returns table(dt date, good boolean)
language sql
security definer
set search_path = public
as

$$

select
day::date as dt,
total_minutes >= 120 as good
from (
select
date_trunc('day', started_at) as day,
sum( extract(epoch from coalesce(ended_at, now()) - started_at)::int - total_break_secs ) / 60 as total_minutes
from study_sessions
where user_id = \_uid
and started_at >= current_date - (\_days - 1)
group by 1
) s;


$$

;

comment on function public.study_calendar is
'Net study minutes per day; “good” if ≥120 min';

-- ─────────────────────────────────────────────────────────────
-- mood_calendar (≥ 4/5 mood) – optional
-- ─────────────────────────────────────────────────────────────
create or replace function public.mood_calendar(
\_uid uuid,
\_days int default 30
)
returns table(dt date, good boolean)
language sql
security definer
set search_path = public
as

$$

select
day,
avg(score) >= 4 as good
from (
select
date_trunc('day', at)::date as day,
score
from mood_logs
where user_id = \_uid
and at >= current_date - (\_days - 1)
) t
group by 1;


$$

;

comment on function public.mood_calendar is
'Averages daily mood; “good” if mean ≥ 4/5';

$$

create index if not exists study_sessions_uid_started_at
  on study_sessions (user_id, started_at);

create index if not exists sleep_logs_uid_date
  on sleep_logs (user_id, date);

create index if not exists mood_logs_uid_at
  on mood_logs (user_id, at);
$$

_Begin by finding a comfortable position. You can sit in a chair with your feet flat on the ground, or if you prefer, you may lie down. Allow your body to settle, and gently close your eyes if you feel comfortable doing so._

_Take a deep breath in, filling your lungs completely… and exhale slowly, releasing any tension. Let’s do this a few more times. Inhale deeply through your nose… hold it for a moment… now exhale gently through your mouth, letting go of anything that no longer serves you. As you continue to breathe slowly, notice the rise and fall of your chest._

_Now, shift your focus to your body. Starting at the top of your head, feel a warm wave of relaxation flowing down. Allow this comforting sensation to move down your forehead, relaxing your brow… releasing any tightness in your jaw. Let your shoulders drop, feeling lighter with each exhale._

_Feel this warm wave continue down your arms, through your elbows, to your fingertips. Notice the sensation as your fingers relax and prepare to let go of the day._

\*As you breathe in, invite peace into your heart. And as you breathe out, imagine releasing any stresses or worries, watching them float
