-- Step 1: Add the column
ALTER TABLE todos ADD COLUMN priority INTEGER;

-- Step 2: Backfill with unique priorities per user
-- Use a CTE with row_number() for clean priorities per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rank
  FROM todos
)
UPDATE todos
SET priority = ranked.rank
FROM ranked
WHERE todos.id = ranked.id;

-- Step 3: Set NOT NULL now that all rows have a value
ALTER TABLE todos ALTER COLUMN priority SET NOT NULL;

-- Step 4: Enforce uniqueness
CREATE UNIQUE INDEX unique_priority_per_user ON todos (user_id, priority);
