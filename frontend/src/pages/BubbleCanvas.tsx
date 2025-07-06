import React, { useRef, useLayoutEffect, useCallback, useEffect } from 'react';

/* ─── tweakables ─── */
const MAX_BUBBLES = 30;
const SPAWN_INTERVAL_MS = 800;

const BASE_RADIUS = 40; // ⟵ bigger
const RADIUS_JITTER = 20;

const RISE_MIN_SPEED = 10; // px/sec (slower)
const RISE_MAX_SPEED = 30;
const H_DRIFT = 30;
const WOBBLE_FREQ = 1.4; // cycles/sec
const POP_DURATION_MS = 600; // ⟵ slower pop

const POP_SOUND_URL = '../assets/bubble_pop.mp3';

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

/* ─── util: pastel HSL to rgba string ─── */
const pastel = (h: number, a: number) => `hsla(${h}, 80%, 85%, ${a})`;

/* ─── component ─── */
const BubbleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const rafRef = useRef<number>();
  const popAudio = useRef<HTMLAudioElement>();

  /* play pop */
  const playPop = useCallback(() => {
    popAudio.current ??= new Audio(POP_SOUND_URL);
    (popAudio.current.cloneNode() as HTMLAudioElement).play().catch(() => {});
  }, []);

  /* make a bubble */
  const spawn = (w: number, h: number) => {
    const r = BASE_RADIUS + (Math.random() - 0.5) * 2 * RADIUS_JITTER;
    const hue = 180 + Math.random() * 140; // pastel blues→purples→pinks
    bubblesRef.current.push({
      id: newId(),
      x: Math.random() * w,
      baseX: Math.random() * w,
      y: h + r + Math.random() * h * 0.2,
      radius: r,
      hue,
      riseSpeed: RISE_MIN_SPEED + Math.random() * (RISE_MAX_SPEED - RISE_MIN_SPEED),
      bornAt: performance.now(),
      popping: false,
    });
  };

  /* draw frame */
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
    ctx.clearRect(0, 0, w, h);

    bubblesRef.current.forEach((b) => {
      /* position */
      b.y -= b.riseSpeed / 60;
      const dt = (now - b.bornAt) / 1000;
      b.x = b.baseX + Math.sin((dt + b.id) * WOBBLE_FREQ * Math.PI * 2) * H_DRIFT;

      /* pop anim */
      let r = b.radius;
      let alpha = 0.7;
      if (b.popping && b.popStart !== undefined) {
        const p = Math.min((now - b.popStart) / POP_DURATION_MS, 1);
        r *= 1 - p;
        alpha *= 1 - p;
        if (p >= 1) b.radius = 0;
      }

      /* gradient */
      if (r > 0.5) {
        const g = ctx.createRadialGradient(b.x - r * 0.4, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
        g.addColorStop(0.3, pastel(b.hue, 0.35 * alpha));
        g.addColorStop(1, pastel(b.hue, 0.05 * alpha));
        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.ellipse(b.x, b.y, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    /* purge */
    bubblesRef.current = bubblesRef.current.filter((b) => b.y + b.radius > -50 && b.radius > 0.5);
  }, []);

  /* click-to-pop */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [playPop],
  );

  /* resize helper */
  const resize = (c: HTMLCanvasElement) => {
    c.width = window.innerWidth * devicePixelRatio;
    c.height = window.innerHeight * devicePixelRatio;
  };

  /* mount */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize(canvas);

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

    window.addEventListener('resize', () => resize(canvas));
    return () => {
      cancelAnimationFrame(rafRef.current!);
      window.removeEventListener('resize', () => resize(canvas));
    };
  }, [draw]);

  return <canvas ref={canvasRef} className='fixed inset-0 z-20 touch-none select-none' onClick={handleClick} />;
};

export default BubbleCanvas;
