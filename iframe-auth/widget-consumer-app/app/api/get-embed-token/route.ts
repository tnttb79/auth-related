// Widget consumer proxy for fetching an embed token from the producer.
// The browser calls this route; the producer API key stays on the consumer server.
// The producer now derives the chatbot from the API key, so the request body is empty.

export async function GET() {
  const apiKey = process.env.YOURCHAT_API_KEY
  const widgetOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "http://localhost:3000"

  if (!apiKey) {
    return Response.json(
      {
        error:
          "YOURCHAT_API_KEY must be set in .env.local (create one from the producer dashboard at /dashboard).",
      },
      { status: 500 },
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
