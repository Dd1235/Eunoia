/* -----------------------------------------------------------------------
   BubbleCanvas.tsx
   Realistic soap-bubble layer (HTML5 Canvas) for React + Vite + Tailwind
------------------------------------------------------------------------ */

import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';

/* ─────────── configurable constants ─────────── */
const MAX_BUBBLES = 30;
const SPAWN_INTERVAL_MS = 800;
const BASE_RADIUS = 22;
const RADIUS_JITTER = 14;
const RISE_MIN_SPEED = 120; // Increased from 30
const RISE_MAX_SPEED = 240; // Increased from 80
const H_DRIFT = 25;
const WOBBLE_FREQ = 2;
const POP_DURATION_MS = 250;

const POP_SOUND_URL = '../assets/bubble_pop.mp3';

/* ─────────── types ─────────── */
interface Bubble {
  id: number;
  x: number;
  y: number;
  baseX: number;
  radius: number;
  riseSpeed: number;
  bornAt: number;
  popping: boolean;
  popStart?: number;
}

/* ─────────── helpers ─────────── */
let idCounter = 0;
const nextId = () => ++idCounter;

/* ─────────── component ─────────── */
const BubbleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();

  /* play pop sound */
  const playPop = useCallback(() => {
    if (!audioRef.current) audioRef.current = new Audio(POP_SOUND_URL);
    (audioRef.current.cloneNode() as HTMLAudioElement).play().catch(() => {});
  }, []);

  /* spawn a bubble - FIXED: spawn position calculation */
  const spawnBubble = (w: number, h: number) => {
    const r = BASE_RADIUS + (Math.random() - 0.5) * 2 * RADIUS_JITTER;
    bubblesRef.current.push({
      id: nextId(),
      x: Math.random() * w,
      baseX: Math.random() * w,
      y: h + r, // Start just below canvas
      radius: r,
      riseSpeed: RISE_MIN_SPEED + Math.random() * (RISE_MAX_SPEED - RISE_MIN_SPEED),
      bornAt: performance.now(),
      popping: false,
    });
  };

  /* draw frame */
  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
    ctx.clearRect(0, 0, w, h);

    bubblesRef.current.forEach((b) => {
      // Update position using time-based movement
      const dt = (now - b.bornAt) / 1000;
      b.y = h + b.radius - b.riseSpeed * dt; // Time-based position
      b.x = b.baseX + Math.sin((dt + b.id) * WOBBLE_FREQ * 2 * Math.PI) * H_DRIFT;

      // popping animation
      let r = b.radius;
      let alpha = 0.6;
      if (b.popping && b.popStart !== undefined) {
        const p = Math.min((now - b.popStart) / POP_DURATION_MS, 1);
        r *= 1 - p;
        alpha *= 1 - p;
        if (p >= 1) b.radius = 0;
      }

      // draw bubble
      if (r > 0.5) {
        const grd = ctx.createRadialGradient(b.x - r * 0.4, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
        grd.addColorStop(0, `rgba(255,255,255,${0.7 * alpha})`);
        grd.addColorStop(0.4, `rgba(255,255,255,${0.25 * alpha})`);
        grd.addColorStop(1, `rgba(180,180,255,${0.1 * alpha})`);
        ctx.fillStyle = grd;

        ctx.beginPath();
        ctx.ellipse(b.x, b.y, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // remove popped/off-screen bubbles
    bubblesRef.current = bubblesRef.current.filter((b) => b.y + b.radius > -50 && b.radius > 0.5);
  }, []);

  /* click → pop */
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

  /* resize canvas to viewport */
  const resize = useCallback((canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
  }, []);

  /* mount & animation loop */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resize(canvas);

    let lastSpawn = 0;
    const loop = (t: number) => {
      if (t - lastSpawn > SPAWN_INTERVAL_MS && bubblesRef.current.length < MAX_BUBBLES) {
        spawnBubble(canvas.width, canvas.height);
        lastSpawn = t;
      }

      draw(ctx, canvas.width, canvas.height, t);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    const resizeHandler = () => resize(canvas);
    window.addEventListener('resize', resizeHandler);

    return () => {
      cancelAnimationFrame(animRef.current!);
      window.removeEventListener('resize', resizeHandler);
    };
  }, [draw, resize]);

  /* render */
  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <h1 className='absolute z-10 p-4 text-4xl font-bold text-white'>Pop Bubbles</h1>
      <canvas
        ref={canvasRef}
        className='absolute inset-0 bg-gradient-to-b from-sky-500 to-indigo-700'
        onClick={handleClick}
      />
    </div>
  );
};

export default BubbleCanvas;
