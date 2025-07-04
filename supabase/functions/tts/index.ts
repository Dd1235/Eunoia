import 'https://deno.land/std@0.224.0/dotenv/load.ts'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import OpenAI    from 'npm:openai'

const CORS = {
  'Access-Control-Allow-Origin' : '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_KEY') })

serve(async req => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: CORS })

  const { text, voice = 'nova' } = await req.json()

  if (!text || typeof text !== 'string')
    return new Response('Bad text', { status: 400, headers: CORS })

  const wav = await openai.audio.speech.create({
    model       : 'tts-1',
    voice,
    input       : text,
    format      : 'wav',
    sample_rate : 48000,               // 48 kHz stereo → safest
  })

  const buf = new Uint8Array(await wav.arrayBuffer())

  return new Response(buf, {
    status : 200,
    headers: {
      ...CORS,
      'Content-Type'       : 'audio/wav',
      'Content-Length'     : String(buf.byteLength),
      'Content-Disposition': 'attachment; filename="meditation.wav"',
    },
  })
})
