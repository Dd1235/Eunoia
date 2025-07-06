-- Revoke all permissions from 'anon' on mood_logs
revoke all on table "public"."mood_logs" from anon;

-- Revoke all permissions from 'anon' on sleep_logs
revoke all on table "public"."sleep_logs" from anon;

-- Revoke all permissions from 'anon' on study_sessions
revoke all on table "public"."study_sessions" from anon;
