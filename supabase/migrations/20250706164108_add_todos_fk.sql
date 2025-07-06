-- Add foreign key constraint to link todos.user_id with auth.users.id
alter table "public"."todos"
add constraint fk_user
foreign key ("user_id")
references auth.users(id)
on delete cascade;
