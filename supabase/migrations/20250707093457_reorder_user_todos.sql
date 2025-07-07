-- migrations/20250707_reorder_user_todos.sql  (or run in SQL editor)

CREATE OR REPLACE FUNCTION reorder_user_todos(
  uid         uuid,
  ordered_ids jsonb         -- ["id1","id2",…]  ← must be jsonb array
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cnt int := jsonb_array_length(ordered_ids);  -- how many items were dragged
BEGIN
  -----------------------------------------------------------------
  -- Phase A: shove everything out of the way (+1000)
  -----------------------------------------------------------------
  UPDATE todos
     SET priority = priority + 1000
   WHERE user_id = uid;

  -----------------------------------------------------------------
  -- Phase B: set the new 1…cnt for the list you passed
  -----------------------------------------------------------------
  WITH new_order AS (
         SELECT (value)::uuid        AS id,
                ROW_NUMBER() OVER () AS new_p
           FROM jsonb_array_elements_text(ordered_ids)
       )
  UPDATE todos t
     SET priority = new_order.new_p
    FROM new_order
   WHERE t.id = new_order.id;

  -----------------------------------------------------------------
  -- Phase C: renumber the remaining rows to cnt+1, cnt+2, …
  -----------------------------------------------------------------
  WITH leftovers AS (
         SELECT id,
                ROW_NUMBER() OVER (ORDER BY priority) + cnt AS new_p
           FROM todos
          WHERE user_id = uid
            AND priority >= 1000          -- still bumped
       )
  UPDATE todos t
     SET priority = leftovers.new_p
    FROM leftovers
   WHERE t.id = leftovers.id;
END;
$$;
