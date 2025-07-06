uvicorn app.main:app --reload

Below I assume your `.env` contains

```
DEV_FAKE_UID=2186bc0f-cc85-4d97-b066-39c625aff1f4
```

so the backend **always treats that UID as the current user** and ignores the
Authorization header.

---

## 1 Handy cURL snippets (copy-paste ready)

> **Tip** Save the first response’s `session_id` to an environment variable so
> you can reuse it.

```bash
############################################################
# 1-A  Start a chat session
############################################################
curl -s -X POST http://127.0.0.1:8000/chat/session \
     -H "Content-Type: application/json" \
     -d '{"user_id":"2186bc0f-cc85-4d97-b066-39c625aff1f4"}' \
     | tee /tmp/session.json

# store the session_id for the next calls (zsh/bash)
export SID=$(jq -r .session_id /tmp/session.json)
echo "Session: $SID"

############################################################
# 1-B  Ask the OpenAI agent a question
############################################################
curl -s -X POST http://127.0.0.1:8000/chat/message \
     -H "Content-Type: application/json" \
     -d @- <<EOF | jq
{
  "session_id": "$SID",
  "user_id": "2186bc0f-cc85-4d97-b066-39c625aff1f4",
  "message": "Give me a quick overview of my sleep quality.",
  "model":   "openai"
}
EOF

############################################################
# 1-C  Ask the Gemini agent instead
############################################################
curl -s -X POST http://127.0.0.1:8000/chat/message \
     -H "Content-Type: application/json" \
     -d @- <<EOF | jq
{
  "session_id": "$SID",
  "user_id": "2186bc0f-cc85-4d97-b066-39c625aff1f4",
  "message": "Compare study hours vs mood this fortnight.",
  "model":   "gemini"
}
EOF

############################################################
# 1-D  Generate a 1-minute meditation MP3
############################################################
curl -s -X POST http://127.0.0.1:8000/meditate/ \
     -H "Content-Type: application/x-www-form-urlencoded" \
     --data-urlencode "prompt=unwind after coding" | tee /tmp/med.json

# Download the returned file
curl -o relax.mp3 "http://127.0.0.1:8000$(jq -r .audioUrl /tmp/med.json)"
```

All calls succeed with **no** Bearer header because the backend short-circuits
to `DEV_FAKE_UID`.

---

## 2 Folder-by-folder rationale (and where to put new stuff)

```
backend/
└─ app/
   ├─ core/          # one-time app bootstrap
   │   config.py     # env-vars, DEV_FAKE_UID logic, load_dotenv
   │   logging.py    # global logging config
   │
   ├─ models/        # Pydantic request/response schemas ONLY
   │   chat.py
   │
   ├─ services/      # ALL business logic, 100 % framework-free
   │   supabase_logs.py      # DB queries for study/sleep/mood
   │   session_store.py      # in-mem → swap for Redis later
   │   meditation.py         # TTS + background-music pipeline
   │   agent_logic.py        # small helpers (intro message)
   │   agents/               # each LLM vendor in its own file
   │       base.py           # prompt builder utils
   │       openai_agent.py
   │       gemini_agent.py
   │       router.py         # picks the agent
   │
   ├─ api/            # FastAPI routers (HTTP surface only)
   │   deps.py        # auth dependency (DEV_FAKE_UID lives here)
   │   chat.py        # /chat/session & /chat/message
   │   meditate.py    # /meditate/ endpoints
   │
   └─ main.py         # FastAPI() instance, mounts routers, CORS
```

### Design rules & how you extend

| You want to…                                                    | Put code here                                                               | Why                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Add a new HTTP feature**<br>(e.g., `/analytics`, `/goals`)    | `api/analytics.py` (router) + helper functions in `services/analytics.py`   | Keeps web layer thin; logic testable without FastAPI |
| **Support more agent models**<br>(Claude, Mistral, local Llama) | `services/agents/claude_agent.py` and register it in `agents/router.py`     | Zero API changes; swap model in the request          |
| **Give agents extra tools**<br>(weather, news, vector search)   | Implement in `services/tools/…`<br>Wrap a helper function in the agent code | Tools stay reusable and vendor-agnostic              |
| **Persist sessions in Redis**                                   | New `RedisSessionStore` in `services/session_store.py` (or sub-package)     | No router changes, just change the import            |
| **Schedule background jobs**<br>(Celery, APScheduler)           | Package `services/tasks/` that imports the same helpers                     | Shares config/logger, independent of web layer       |
| **Share code with a CLI or Jupyter notebook**                   | Import directly from `services/`                                            | Framework-free = instant reuse                       |

> **Mental model**:
> _core_ → “run once”; _models_ → “just data”; _services_ → “do stuff”;
> _api_ → “expose stuff”; everything else plugs in at the right tier.

By following the “thin API, fat services” principle and keeping vendor-specific
code in clearly named adapters, you can bolt on new functionality (routes,
LLMs, tools, storage back-ends) without a structural rewrite.
