create or replace function increment_priorities_for_user(uid uuid)
returns void as $$
begin
  update todos
  set priority = priority + 1
  where user_id = uid;
end;
$$ language plpgsql;
