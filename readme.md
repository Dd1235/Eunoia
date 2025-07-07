Work in Progress

Remarks: I am storing the logs in session storage (ps direct communication iwth supabase backend, fastapi backend is separate from this, in case the ai chat is down, the logs would still be independent of that), the reason for storing in session storage is to avoid loading again and again if you change pages while on the same website.

But that means that if you add a new log, it will be reflected in the database, but not /logs,
refreshing also won't update since it will fetch from session storage, can simply remove session storage, or need to find a way to have smarter caching.

Closing and reopening tab should update the logs

Could've used cloud firestore, bonus google points, but I wanted to use a relational database. Already used mongodb for edureach, and had DBMS last semester, so wanted to put those sql skills to use.

Using react query, need to learn it better.
Was using useEffects and the typical flow for Edureach

I LOVE SUPABASE!!!

OAuth login signup in two lines of code!!

7th July log

In a todo list where a priority field is used to define display order, maintaining a gapless and strictly increasing sequence (1, 2, 3, ...) can introduce complexity when handling inserts, deletions, and reordering. One approach is to consistently insert new items at the top with priority = 1, shifting all other items down by incrementing their priorities. This ensures the newest items appear at the top while preserving order semantics. When a todo is deleted, the resulting gap in the sequence does not impact functionality, as the UI continues to sort by priority. Gaps are harmless and only become a concern if strict contiguity is required, such as when hitting a maximum item limit or for clean index management. In such cases, priorities can be rebalanced lazily during drag-and-drop reordering by reassigning them from 1 to N in visual order. This strategy works well under the assumption that each user maintains a relatively small number of todos (e.g., ≤50), making the occasional full reordering operation efficient, while avoiding the overhead of rebalancing on every insert or delete.

---

## What went wrong — timeline

| Step  | Action                                                                                                                                              | Result                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **1** | Added UNIQUE index `(user_id, priority)`                                                                                                            | Any momentary duplicate priority → `23505` error   |
| **2** | Original client logic updated rows **one-by-one**                                                                                                   | Drag-drop & insert both crashed (`duplicate key…`) |
| **3** | We introduced a “two-phase” SQL fix:<br>   • shift `+1000` → renumber **1…N**                                                                       | Drag-drop now safe ✔️                              |
| **4** | **Insert** still failed: renumbering back to **1** left **no free slot** for the new row (we insert `priority = 1`, clashing with the old top item) | `23505` persists on **add todo**                   |

### 1 Replace `increment_priorities_for_user` with **“leave slot #1 free”** version

```sql
create or replace function increment_priorities_for_user(uid uuid)
returns void
language plpgsql
as $$
begin
  -- Phase A: move everyone far away
  update todos
     set priority = priority + 1000
   where user_id = uid;

  -- Phase B: renumber back starting at **2** (so 1 is free)
  with ranked as (
       select id,
              row_number() over (order by priority) + 1  -- note **+1**
                as new_p
         from todos
        where user_id = uid
  )
  update todos t
     set priority = ranked.new_p
    from ranked
   where t.id = ranked.id;
end;
$$;
```

_Outcome:_ after the function runs, all existing todos are `2, 3, 4…`, leaving
`1` vacant for the incoming todo ⇒ **no duplicate**.

### 2 Client code stays almost identical

You already changed the call signature (`ordered_ids`).
The only thing to verify is that **`addTodo`** still calls this RPC before the
`insert` (it does):

```ts
await supabase.rpc("increment_priorities_for_user", { uid: user!.id });
await supabase.from("todos").insert({
  content,
  user_id: user!.id,
  priority: 1, // now guaranteed unique
});
```

### 3 (One-off) wipe any lingering duplicates

If previous crashes left duplicates, run once in SQL console:

```sql
with ranked as (
  select id,
         row_number() over (partition by user_id order by priority) as new_p
    from todos
)
update todos t
   set priority = ranked.new_p
  from ranked
 where t.id = ranked.id;
```
