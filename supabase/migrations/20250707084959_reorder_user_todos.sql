-- migrations/20250707_reorder_user_todos.sql
-- migrations/20250707_reorder_user_todos.sql
create or replace function reorder_user_todos(
  uid uuid,
  ordered_ids jsonb        -- <── keep this exact name
)
returns void
language plpgsql
as $$
begin
  update todos t
     set priority = s.new_p
    from (
          select (value)::uuid        as id,
                 row_number() over () as new_p
            from jsonb_array_elements_text(ordered_ids)
         ) s
   where t.id = s.id
     and t.user_id = uid;
end;
$$;
