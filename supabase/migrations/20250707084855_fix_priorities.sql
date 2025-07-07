-- migrations/20250707_fix_priorities.sql
create or replace function increment_priorities_for_user(uid uuid)
returns void
language plpgsql
as $$
begin
  ------------------------------------------------------------
  -- 1. Move every row safely out of the way (+1000 keeps gaps)
  ------------------------------------------------------------
  update todos
     set priority = priority + 1000
   where user_id = uid;

  ------------------------------------------------------------
  -- 2. Collapse back to 1…N in a single, duplicate-free pass
  ------------------------------------------------------------
  with ranked as (
       select id,
              row_number() over (order by priority) as new_p
         from todos
        where user_id = uid
  )
  update todos t
     set priority = r.new_p
    from ranked r
   where t.id = r.id;
end;
$$;
