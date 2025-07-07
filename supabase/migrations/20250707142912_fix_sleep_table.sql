-- Step 1: Delete all duplicate rows keeping only one per (user_id, date)
DELETE FROM sleep_logs
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, date) id
    FROM sleep_logs
    ORDER BY user_id, date, id
  ) keep
);

-- Step 2: Add unique constraint
ALTER TABLE sleep_logs
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
