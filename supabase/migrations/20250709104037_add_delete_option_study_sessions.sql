-- Allow users to delete only their own study sessions
create policy "study owner"
on "public"."study_sessions"
as permissive
for delete
to public
using ((auth.uid() = user_id));