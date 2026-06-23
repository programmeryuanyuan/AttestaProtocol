import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

const ZG_BASE = "https://router-api.0g.ai/v1"
const MODEL   = "glm-5.2"

export async function POST(req: NextRequest) {
  const apiKey = process.env.ZERO_G_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "ZERO_G_API_KEY not configured" }, { status: 500 })
  }

  const { criteria } = await req.json()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)

  let res: Response
  try {
    res = await fetch(`${ZG_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are Agent B, a professional AI assistant completing delegated tasks. " +
              "Produce precise, well-structured deliverables that directly satisfy the given criteria. " +
              "Write in a professional, concise style. Do not include meta-commentary.",
          },
          {
            role: "user",
            content: `Complete this task:\n\n${criteria}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 900,
      }),
    })
  } catch (err: any) {
    clearTimeout(timeout)
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "0G API timeout after 25s" }, { status: 504 })
    }
    return NextResponse.json({ error: String(err) }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: `0G API ${res.status}: ${body}` }, { status: 502 })
  }

  const data = await res.json()
  const output: string = data.choices?.[0]?.message?.content ?? ""
  return NextResponse.json({ output })
}
