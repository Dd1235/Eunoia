import { Container } from '../components/Layout/Container';

const About = () => (
  <Container>
    <article className='prose prose-slate max-w-none pb-24 pt-8 dark:prose-invert'>
      <h1 className='mt-4'>
        About <span className='italic'>Eunoia&nbsp;App</span>
      </h1>

      <p>
        <strong>Eunoia&nbsp;</strong> is a minimalist tool for tracking work sessions &amp; wellbeing signals (sleep,
        mood) in one place. The goal is to finally make a journalling app of sorts, focused on productivity, hence study
        sleep and mood for now. A holistic view. There is a &quot;productivity&quot; score right now in the study
        logging, this embodies the philosophy or using your displacement as a measure instead of distance. Future work
        would improve upon this. The logs will help you reflect on the connections, productivity is much better when
        there are breaks in between, or when your sleep has been good. After I work on some dashboards, I shall work
        some AI integrations, plus an MCP server. I also wish to include in exercise and diet into this.
      </p>

      <h2>✨ Design Philosophy</h2>
      <ul>
        <li>Responsive &amp; dark-mode by default.</li>
      </ul>

      <h2>🛠 Tech Stack</h2>
      <ul>
        <li>React + TypeScript (Vite + SWC)</li>
        <li>Tailwind CSS&nbsp;(+ Typography plugin)</li>
        <li>Supabase (PostgreSQL + RLS) for auth &amp; data</li>
        <li>Heroicons for lightweight SVG icons</li>
      </ul>

      <h2>✅ What’s Done</h2>
      <ol>
        <li>Study timer with pause/resume + per-user DB logging</li>
        <li>Sleep &amp; mood quick-log, persisted for signed-in users</li>
        <li>
          Unified <code>/logs</code> view with icons &amp; sorting
        </li>
      </ol>

      <p className='not-prose  text-sm text-gray-500 dark:text-gray-400'>
        Built by Dedeepya A. — MIT-licensed, source on GitHub.
      </p>
    </article>
  </Container>
);

export default About;
