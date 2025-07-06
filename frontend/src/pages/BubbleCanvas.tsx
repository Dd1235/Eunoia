import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
/* top of file */
import popWav from '../assets/bubble_pop.mp3'; //  bundler now knows about it

const POP_SOUND_URL = popWav;

/* ─── tweakables ─── */
const MAX_BUBBLES = 10;
const SPAWN_INTERVAL_MS = 1200;

const BASE_RADIUS = 200;
const RADIUS_JITTER = 25;

const RISE_MIN_SPEED = 2; // px / frame (≈ 300 px / s)
const RISE_MAX_SPEED = 8; // slower overall
const H_DRIFT = 30;
const WOBBLE_FREQ = 1.2;
const POP_DURATION_MS = 600;

// const POP_SOUND_URL = '../assets/bubble_pop.mp3';

/* ─── types & helpers ─── */
interface Bubble {
  id: number;
  x: number;
  y: number;
  baseX: number;
  radius: number;
  hue: number;
  riseSpeed: number;
  bornAt: number;
  popping: boolean;
  popStart?: number;
}
let idCounter = 0;
const newId = () => ++idCounter;

/* beefier pastel */
const pastel = (h: number, a: number) => `hsla(${h}, 90%, 75%, ${a})`;
const isDark = () => document.documentElement.classList.contains('dark');

const BubbleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const rafRef = useRef<number>();
  const popAudio = useRef<HTMLAudioElement>();

  const [dark, setDark] = useState<boolean>(isDark);
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver(() => setDark(isDark()));
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  const colour = (h: number, a: number) =>
    dark
      ? `hsla(${h}, 100%, 70%, ${Math.min(1, a * 1.2)})` // neon in dark mode
      : `hsla(${h}, 85%, 78%, ${a})`; // pastel in light mode

  // const playPop = useCallback(() => {
  //   popAudio.current ??= new Audio(POP_SOUND_URL);
  //   (popAudio.current.cloneNode() as HTMLAudioElement).play().catch(() => {});
  // }, []);
  const playPop = useCallback(() => {
    popAudio.current ??= new Audio(POP_SOUND_URL); // cached master
    const sfx = popAudio.current.cloneNode() as HTMLAudioElement;
    sfx.play().catch(() => {}); // click → user gesture → allowed
  }, []);

  /* spawn one */
  const spawn = (w: number, h: number) => {
    const r = BASE_RADIUS + (Math.random() - 0.5) * 2 * RADIUS_JITTER;
    const hue = 180 + Math.random() * 140; // blue->purple->pink
    bubblesRef.current.push({
      id: newId(),
      x: Math.random() * w,
      baseX: Math.random() * w,
      // start just below bottom edge, not miles away
      y: h - r * 0.3 - Math.random() * h * 0.1,
      radius: r,
      hue,
      riseSpeed: RISE_MIN_SPEED + Math.random() * (RISE_MAX_SPEED - RISE_MIN_SPEED),
      bornAt: performance.now(),
      popping: false,
    });
  };

  /* draw frame */
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
      if (dark) {
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#0b0c23'); // deep night top
        bg.addColorStop(1, '#0f1129'); // deeper bottom
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h); // default light mode
      }

      bubblesRef.current.forEach((b) => {
        /* position */
        b.y -= b.riseSpeed;
        const dt = (now - b.bornAt) / 1000;
        b.x = b.baseX + Math.sin((dt + b.id) * WOBBLE_FREQ * Math.PI * 2) * H_DRIFT;

        /* pop anim */
        let r = b.radius;
        let alpha = 0.8;
        if (b.popping && b.popStart !== undefined) {
          const p = Math.min((now - b.popStart) / POP_DURATION_MS, 1);
          r *= 1 - p;
          alpha *= 1 - p;
          if (p >= 1) b.radius = 0; // mark dead
        }

        if (r > 0.5) {
          if (dark) {
            /* ─────────  NEON RING STYLE  ───────── */
            ctx.save();

            /* 1️⃣  —— outer bloom ——
       draw a fat blurred stroke; ‘lighter’ makes blooms accumulate */
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = r * 0.25; // thick glow shell
            ctx.strokeStyle = `hsla(${b.hue}, 100%, 60%, 0.35)`; // coloured bloom
            ctx.shadowBlur = r * 0.9; // big halo
            ctx.shadowColor = `hsla(${b.hue}, 100%, 60%, 0.8)`;

            ctx.beginPath();
            ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
            ctx.stroke();

            /* 2️⃣  —— crisp inner core —— */
            ctx.shadowBlur = 0; // no blur
            ctx.lineWidth = r * 0.07; // skinny bright rim
            ctx.strokeStyle = '#fff'; // electric white
            ctx.beginPath();
            ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
            ctx.stroke();

            /* 3️⃣  —— optional highlight arc —— */
            ctx.lineWidth = r * 0.05;
            ctx.strokeStyle = `hsla(${b.hue + 40},100%,75%,1)`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, r * 0.65, Math.PI * 0.2, Math.PI * 0.6);
            ctx.stroke();

            ctx.restore();
          } else {
            /* pastel fill for light mode (unchanged) */
            const g = ctx.createRadialGradient(b.x - r * 0.4, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
            g.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
            g.addColorStop(0.3, colour(b.hue, 0.5 * alpha));
            g.addColorStop(1, colour(b.hue, 0.08 * alpha));

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      /* purge off-screen / popped */
      bubblesRef.current = bubblesRef.current.filter(
        (b) => b.radius > 0.5 && b.y + b.radius > -50 && b.y - b.radius < h + 50,
      );
    },
    [dark],
  );

  /* click-to-pop */
  const handleClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * devicePixelRatio;
    const y = (e.clientY - rect.top) * devicePixelRatio;
    const now = performance.now();

    for (const b of bubblesRef.current) {
      if (!b.popping && Math.hypot(x - b.x, y - b.y) < b.radius) {
        b.popping = true;
        b.popStart = now;
        playPop();
        break;
      }
    }
  };

  /* mount / loop */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastSpawn = 0;
    const loop = (t: number) => {
      if (t - lastSpawn > SPAWN_INTERVAL_MS && bubblesRef.current.length < MAX_BUBBLES) {
        spawn(canvas.width, canvas.height);
        lastSpawn = t;
      }
      draw(ctx, canvas.width, canvas.height, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current!);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className='mx-auto mt-6 h-[80vh] w-[95vw] touch-none
                 select-none rounded-lg bg-transparent
                 shadow-inner dark:bg-slate-900/10'
    />
  );
};

export default BubbleCanvas;
