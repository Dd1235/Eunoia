insert into free_notes (user_id, content, tag)
select id, '', 'todos_sidebar'
from auth.users
where id not in (
  select user_id from free_notes where tag = 'todos_sidebar'
);
