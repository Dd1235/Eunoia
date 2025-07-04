/* ------------------------------------------------------------------
   Shared meditation helpers
   ------------------------------------------------------------------ */

import { useRef, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'

/* ----------  ENV helpers ----------------------------------------- */
const isDev              = import.meta.env.DEV
const LOCAL_FUNCTION_URL = 'http://localhost:8000'
const apiUrl = (p: string) => (isDev ? `${LOCAL_FUNCTION_URL}${p}` : `/functions/v1${p}`)

/* ------------------------------------------------------------------ */
/* 1. GPT-script generator                                            */
/* ------------------------------------------------------------------ */
export const useGenerateScript = () =>
  useMutation({
    mutationFn: async (body: { prompt?: string }) => {
      const r = await fetch(apiUrl('/generate_meditation_script'), {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      })
      if (!r.ok) throw new Error(await r.text())
      return r.json() as Promise<{ script: string }>
    },
  })

/* ------------------------------------------------------------------ */
/* 2. TTS fetcher  (returns Blob + object-URL)                        */
/* ------------------------------------------------------------------ */
export async function fetchSpeechBlob(
  text: string,
  voice: 'nova' | 'alloy' = 'nova',
): Promise<{ blob: Blob; url: string }> {

  const r = await fetch(apiUrl('/tts'), {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ text, voice }),
  })

  const mime = r.headers.get('Content-Type') ?? ''
  if (!r.ok || !mime.startsWith('audio/')) {
    /* bubble server-side error up to the UI */
    const msg = await r.text()
    throw new Error(`TTS failed (${r.status}) → ${msg.slice(0,200)}`)
  }

  const blob = await r.blob()          // now guaranteed audio/*
  return { blob, url: URL.createObjectURL(blob) }
}

/* ------------------------------------------------------------------ */
/* 3. Local downloader (no deps)                                      */
/* ------------------------------------------------------------------ */
export function download(blob: Blob, filename = 'meditation.wav') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)          // Firefox needs it in the DOM
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 5_000)
}

/* ------------------------------------------------------------------ */
/* 4. Unified audio player (handles autoplay-blocked browsers)        */
/* ------------------------------------------------------------------ */
type Ambience = 'none' | 'rain' | 'ocean'
export type PlayResult = 'ok' | 'blocked'

export function useMeditationPlayer() {
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const ambienceRef  = useRef<HTMLAudioElement | null>(null)
  const lastUrlRef   = useRef<string | null>(null)
  const lastBgRef    = useRef<Ambience>('none')

  /* -- helpers -- */
  const reset = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    ambienceRef.current?.pause()
    ambienceRef.current = null
  }, [])

  const attachAmbience = useCallback((bg: Ambience) => {
    if (bg === 'none' || ambienceRef.current) return
    ambienceRef.current = new Audio(`/audio/${bg}.mp3`)
    ambienceRef.current.loop = true
    ambienceRef.current.volume = 0.35
    ambienceRef.current.play().catch(() => {})
  }, [])

  /* -- main API -- */
  const play = useCallback(
    async (url: string, bg: Ambience): Promise<PlayResult> => {
      reset()
      lastUrlRef.current = url
      lastBgRef.current  = bg

      narrationRef.current = new Audio(url)
      narrationRef.current.onended = () => ambienceRef.current?.pause()
      if (bg !== 'none') {
        narrationRef.current.addEventListener('playing', () => attachAmbience(bg), { once: true })
      }

      try {
        await narrationRef.current.play()
        return 'ok'
      } catch (err: any) {
        return err?.name === 'NotAllowedError' || err?.name === 'AbortError' ? 'blocked' : (() => { throw err })()
      }
    },
    [attachAmbience, reset],
  )

  const resume = useCallback(async (): Promise<PlayResult> => {
    /* ensure AudioContext resumed (some mobile browsers need this) */
    try {
      // @ts-ignore
      if (!window.__eunoiaCtx) window.__eunoiaCtx = new AudioContext()
      // @ts-ignore
      if (window.__eunoiaCtx.state === 'suspended') await window.__eunoiaCtx.resume()
    } catch {}

    if (!narrationRef.current && lastUrlRef.current) {
      narrationRef.current = new Audio(lastUrlRef.current)
      narrationRef.current.onended = () => ambienceRef.current?.pause()
      if (lastBgRef.current !== 'none') {
        narrationRef.current.addEventListener('playing', () => attachAmbience(lastBgRef.current), { once: true })
      }
    }

    try {
      await narrationRef.current!.play()
      if (lastBgRef.current !== 'none') attachAmbience(lastBgRef.current)
      return 'ok'
    } catch (err: any) {
      return err?.name === 'NotAllowedError' || err?.name === 'AbortError' ? 'blocked' : (() => { throw err })()
    }
  }, [attachAmbience])

  const pause = () => {
    narrationRef.current?.pause()
    ambienceRef.current?.pause()
  }

  return { play, pause, resume, stop: reset }
}
