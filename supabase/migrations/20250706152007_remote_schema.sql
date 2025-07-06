create table "public"."mood_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "at" timestamp with time zone not null,
    "score" integer,
    "note" text
);


alter table "public"."mood_logs" enable row level security;

create table "public"."sleep_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "date" date not null,
    "score" integer,
    "note" text
);


alter table "public"."sleep_logs" enable row level security;

create table "public"."study_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid default auth.uid(),
    "started_at" timestamp with time zone not null,
    "ended_at" timestamp with time zone,
    "total_break_secs" integer default 0,
    "productivity" integer,
    "note" text
);


alter table "public"."study_sessions" enable row level security;

CREATE UNIQUE INDEX mood_logs_pkey ON public.mood_logs USING btree (id);

CREATE INDEX mood_logs_uid_at ON public.mood_logs USING btree (user_id, at);

CREATE UNIQUE INDEX sleep_logs_pkey ON public.sleep_logs USING btree (id);

CREATE INDEX sleep_logs_uid_date ON public.sleep_logs USING btree (user_id, date);

CREATE UNIQUE INDEX study_sessions_pkey ON public.study_sessions USING btree (id);

CREATE INDEX study_sessions_uid_started_at ON public.study_sessions USING btree (user_id, started_at);

alter table "public"."mood_logs" add constraint "mood_logs_pkey" PRIMARY KEY using index "mood_logs_pkey";

alter table "public"."sleep_logs" add constraint "sleep_logs_pkey" PRIMARY KEY using index "sleep_logs_pkey";

alter table "public"."study_sessions" add constraint "study_sessions_pkey" PRIMARY KEY using index "study_sessions_pkey";

alter table "public"."mood_logs" add constraint "mood_logs_score_check" CHECK (((score >= 1) AND (score <= 5))) not valid;

alter table "public"."mood_logs" validate constraint "mood_logs_score_check";

alter table "public"."mood_logs" add constraint "mood_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."mood_logs" validate constraint "mood_logs_user_id_fkey";

alter table "public"."sleep_logs" add constraint "sleep_logs_score_check" CHECK (((score >= 1) AND (score <= 10))) not valid;

alter table "public"."sleep_logs" validate constraint "sleep_logs_score_check";

alter table "public"."sleep_logs" add constraint "sleep_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."sleep_logs" validate constraint "sleep_logs_user_id_fkey";

alter table "public"."study_sessions" add constraint "study_sessions_productivity_check" CHECK (((productivity >= 1) AND (productivity <= 10))) not valid;

alter table "public"."study_sessions" validate constraint "study_sessions_productivity_check";

alter table "public"."study_sessions" add constraint "study_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."study_sessions" validate constraint "study_sessions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.mood_calendar(_uid uuid, _days integer DEFAULT 30)
 RETURNS TABLE(dt date, good boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    day,
    avg(score) >= 4 as good
  from (
    select
      date_trunc('day', at)::date as day,
      score
    from mood_logs
    where user_id = _uid
      and at >= current_date - (_days - 1)
  ) t
  group by 1;
$function$
;

CREATE OR REPLACE FUNCTION public.sleep_calendar(_uid uuid, _days integer DEFAULT 30)
 RETURNS TABLE(dt date, good boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    date  as dt,
    score >= 8 as good
  from sleep_logs
  where user_id = _uid
    and date >= current_date - (_days - 1);
$function$
;

CREATE OR REPLACE FUNCTION public.study_calendar(_uid uuid, _days integer DEFAULT 30)
 RETURNS TABLE(dt date, good boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    day::date        as dt,
    total_minutes >= 120 as good
  from (
    select
      date_trunc('day', started_at)        as day,
      sum( extract(epoch from coalesce(ended_at, now()) - started_at)::int
           - total_break_secs ) / 60       as total_minutes
    from study_sessions
    where user_id = _uid
      and started_at >= current_date - (_days - 1)
    group by 1
  ) s;
$function$
;

grant delete on table "public"."mood_logs" to "anon";

grant insert on table "public"."mood_logs" to "anon";

grant references on table "public"."mood_logs" to "anon";

grant select on table "public"."mood_logs" to "anon";

grant trigger on table "public"."mood_logs" to "anon";

grant truncate on table "public"."mood_logs" to "anon";

grant update on table "public"."mood_logs" to "anon";

grant delete on table "public"."mood_logs" to "authenticated";

grant insert on table "public"."mood_logs" to "authenticated";

grant references on table "public"."mood_logs" to "authenticated";

grant select on table "public"."mood_logs" to "authenticated";

grant trigger on table "public"."mood_logs" to "authenticated";

grant truncate on table "public"."mood_logs" to "authenticated";

grant update on table "public"."mood_logs" to "authenticated";

grant delete on table "public"."mood_logs" to "service_role";

grant insert on table "public"."mood_logs" to "service_role";

grant references on table "public"."mood_logs" to "service_role";

grant select on table "public"."mood_logs" to "service_role";

grant trigger on table "public"."mood_logs" to "service_role";

grant truncate on table "public"."mood_logs" to "service_role";

grant update on table "public"."mood_logs" to "service_role";

grant delete on table "public"."sleep_logs" to "anon";

grant insert on table "public"."sleep_logs" to "anon";

grant references on table "public"."sleep_logs" to "anon";

grant select on table "public"."sleep_logs" to "anon";

grant trigger on table "public"."sleep_logs" to "anon";

grant truncate on table "public"."sleep_logs" to "anon";

grant update on table "public"."sleep_logs" to "anon";

grant delete on table "public"."sleep_logs" to "authenticated";

grant insert on table "public"."sleep_logs" to "authenticated";

grant references on table "public"."sleep_logs" to "authenticated";

grant select on table "public"."sleep_logs" to "authenticated";

grant trigger on table "public"."sleep_logs" to "authenticated";

grant truncate on table "public"."sleep_logs" to "authenticated";

grant update on table "public"."sleep_logs" to "authenticated";

grant delete on table "public"."sleep_logs" to "service_role";

grant insert on table "public"."sleep_logs" to "service_role";

grant references on table "public"."sleep_logs" to "service_role";

grant select on table "public"."sleep_logs" to "service_role";

grant trigger on table "public"."sleep_logs" to "service_role";

grant truncate on table "public"."sleep_logs" to "service_role";

grant update on table "public"."sleep_logs" to "service_role";

grant delete on table "public"."study_sessions" to "anon";

grant insert on table "public"."study_sessions" to "anon";

grant references on table "public"."study_sessions" to "anon";

grant select on table "public"."study_sessions" to "anon";

grant trigger on table "public"."study_sessions" to "anon";

grant truncate on table "public"."study_sessions" to "anon";

grant update on table "public"."study_sessions" to "anon";

grant delete on table "public"."study_sessions" to "authenticated";

grant insert on table "public"."study_sessions" to "authenticated";

grant references on table "public"."study_sessions" to "authenticated";

grant select on table "public"."study_sessions" to "authenticated";

grant trigger on table "public"."study_sessions" to "authenticated";

grant truncate on table "public"."study_sessions" to "authenticated";

grant update on table "public"."study_sessions" to "authenticated";

grant delete on table "public"."study_sessions" to "service_role";

grant insert on table "public"."study_sessions" to "service_role";

grant references on table "public"."study_sessions" to "service_role";

grant select on table "public"."study_sessions" to "service_role";

grant trigger on table "public"."study_sessions" to "service_role";

grant truncate on table "public"."study_sessions" to "service_role";

grant update on table "public"."study_sessions" to "service_role";

create policy "mood owner"
on "public"."mood_logs"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "sleep owner"
on "public"."sleep_logs"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "study_insert"
on "public"."study_sessions"
as permissive
for insert
to public
with check ((user_id = auth.uid()));


create policy "study_select"
on "public"."study_sessions"
as permissive
for select
to public
using ((user_id = auth.uid()));



