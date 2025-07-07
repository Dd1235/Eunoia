set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_priorities_for_user(uid uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -----------------------------------------------------------------
  -- Phase A: move every row far away so duplicates can’t happen
  -----------------------------------------------------------------
  UPDATE todos
     SET priority = priority + 1000
   WHERE user_id = uid;

  -----------------------------------------------------------------
  -- Phase B: renumber back to 2, 3, 4 …  (leaving #1 empty)
  -----------------------------------------------------------------
  WITH ranked AS (
       SELECT id,
              ROW_NUMBER() OVER (ORDER BY priority) + 1 AS new_p
         FROM todos
        WHERE user_id = uid
  )
  UPDATE todos t
     SET priority = ranked.new_p
    FROM ranked
   WHERE t.id = ranked.id;
END;
$function$
;


