create policy "study update"
on "public"."study_sessions"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));