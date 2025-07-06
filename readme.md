Work in Progress

Remarks: I am storing the logs in session storage (ps direct communication iwth supabase backend, fastapi backend is separate from this, in case the ai chat is down, the logs would still be independent of that), the reason for storing in session storage is to avoid loading again and again if you change pages while on the same website.

But that means that if you add a new log, it will be reflected in the database, but not /logs,
refreshing also won't update since it will fetch from session storage, can simply remove session storage, or need to find a way to have smarter caching.

Closing and reopening tab should update the logs
