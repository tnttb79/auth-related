// Widget consumer proxy for fetching an embed token from the producer.
// This toy consumer app accepts an API key from the demo UI so users can test
// keys from the dashboard without editing .env.local. Production consumers
// should keep this key on their server instead of passing it through frontend UI.

import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const widgetOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "http://localhost:3000"
  const body = (await req.json().catch(() => ({}))) as { apiKey?: unknown }
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : ""

  if (!apiKey) {
    return Response.json(
      {
        error: "Paste an API key from the dashboard before loading the chat.",
      },
      { status: 400 },
    )
  }

  let res: Response
  try {
    res = await fetch(`${widgetOrigin}/api/embed-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: "{}",
    })
  } catch {
    return Response.json(
      {
        error:
          "Cannot reach the widget producer app. Start widget-producer-app (e.g. port 3000) and ensure NEXT_PUBLIC_WIDGET_ORIGIN matches.",
      },
      { status: 503 },
    )
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }))
    return Response.json(
      { error: error.error ?? "Failed to fetch embed token" },
      { status: res.status },
    )
  }

  const data = await res.json()
  return Response.json({ token: data.token })
}
