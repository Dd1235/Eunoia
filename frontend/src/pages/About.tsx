import { Container } from '../components/Layout/Container';

const About = () => (
  <Container>
    <article className='prose prose-slate max-w-none pb-24 pt-8 dark:prose-invert'>
      <h1 className='mt-4'>
        About <span className='italic'>Eunoia&nbsp;App</span>
      </h1>

      <p>
        <strong>Eunoia</strong> is an AI-powered productivity and wellness companion. Track your study sessions, log
        your sleep and mood, and reflect with intelligent insights—all in one beautifully themed, distraction-free
        space. The app combines minimalist frontend design with a powerful, modular backend built for extensibility.
      </p>

      <h2>✨ Highlights</h2>
      <ul>
        <li>
          Split-panel <b>Logs + AI Chat</b> interface for seamless review and reflection.
        </li>
        <li>Switchable AI agents (OpenAI or Gemini) with Markdown response formatting and persistent chat sessions.</li>
        <li>Meditation audio generation using TTS + background music with an enhanced audio player.</li>
        <li>
          Responsive <b>Profile</b> page with accordion UI and theming controls.
        </li>
        <li>Secure and scalable backend powered by Supabase (RLS-enabled), FastAPI, and modular services.</li>
        <li>Smart caching and session-aware logic via React Context and sessionStorage.</li>
      </ul>

      <h2>🛠 Tech Stack</h2>
      <ul>
        <li>
          <b>Frontend:</b> React + TypeScript, Tailwind CSS, Heroicons
        </li>
        <li>
          <b>Backend:</b> FastAPI, in-memory session store (Redis and Supabase planned)
        </li>
        <li>
          <b>Database:</b> Supabase (PostgreSQL + RLS), Supabase Auth (JWT-based)
        </li>
        <li>
          <b>AI:</b> OpenAI & Gemini (via backend routing layer with context injection)
        </li>
        <li>
          <b>Audio:</b> TTS(OpenAI) + music pipeline for meditation generation (local files)
        </li>
      </ul>

      <h2>📁 Project Structure (Backend)</h2>
      <pre>
        <code>{`backend/
└─ app/
   ├─ core/             # env config, logging setup
   ├─ models/           # Pydantic schemas (chat, logs)
   ├─ services/         # logic layer (framework-free)
   │   ├─ agents/       # openai_agent, gemini_agent, router
   │   ├─ meditation.py # audio generation
   │   ├─ session_store.py  # in-mem (Redis-ready)
   │   └─ supabase_logs.py  # DB fetchers
   ├─ api/              # FastAPI endpoints (chat, meditate)
   └─ main.py           # FastAPI app entry
`}</code>
      </pre>
      <p>Front end is too big of a mess right now.</p>

      <h2>Core Features</h2>
      <ol>
        <li>Study timer with real-time pause/resume tracking + database sync</li>
        <li>Sleep & mood quick-logs with Supabase persistence</li>
        <li>
          Responsive <code>/logs</code> page with type toggles, icon-tagged entries, and split chat panel
        </li>
        <li>Chat with AI agents (OpenAI/Gemini), powered by your past 2 weeks of logs</li>
        <li>Analytics dashboard (streaks, trends, averages - coming soon)</li>
        <li>Profile page with theme controls, accordion UI, and account info</li>
        <li>Audio player for meditation generation with seeking and download</li>
      </ol>

      <h2>Upcoming Improvements</h2>
      <ul>
        <li>Replace in-memory session storage with db</li>
        <li>Track user prompts made for both meditate and chat</li>
        <li>Supabase JWT verification in backend using `Authorization: Bearer` headers</li>
        <li>Enhanced agent capabilities via tools and external API access</li>
        <li>Rate limiting</li>
        <li>MCP server</li>
      </ul>

      <p className='not-prose text-sm text-gray-500 dark:text-gray-400'>
        Built by Dedeepya A. • Source code on GitHub • MIT licensed
      </p>
    </article>
  </Container>
);

export default About;
