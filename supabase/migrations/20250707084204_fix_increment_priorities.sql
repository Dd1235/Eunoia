-- 20250707_fix_increment_priorities.sql
create or replace function increment_priorities_for_user(uid uuid)
returns void
language plpgsql
as $$
begin
  -- 1 Shift everything out of the way
  update todos
     set priority = priority + 1000
   where user_id = uid;

  -- 2 Collapse back to 1…N
  with renum as (
       select id,
              row_number() over (order by priority) as new_p
         from todos
        where user_id = uid
  )
  update todos t
     set priority = r.new_p
    from renum r
   where t.id = r.id;
end;
$$;
