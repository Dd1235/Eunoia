import "https://deno.land/std@0.224.0/dotenv/load.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import OpenAI from "npm:openai"

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_KEY") })
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { prompt = "Surprise me." } = await req.json().catch(()=>({}))

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Compose a calm, 2‑minute guided meditation." },
      { role: "user", content: prompt },
    ],
    max_tokens: 250,
  })

  return new Response(JSON.stringify({ script: completion.choices[0].message.content }), {
    headers: { "Content-Type": "application/json", ...cors },
  })
})