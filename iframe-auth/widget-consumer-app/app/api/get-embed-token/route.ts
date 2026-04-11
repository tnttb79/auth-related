// Widget consumer app proxy for requesting an embed token from the widget producer app.
// The browser calls this route, but the producer API key stays on the consumer server.

export async function GET() {
  const apiKey = process.env.YOURCHAT_API_KEY
  const chatbotId = process.env.CHATBOT_ID
  const widgetOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "http://localhost:3000"

  if (!apiKey || !chatbotId) {
    return Response.json(
      { error: "YOURCHAT_API_KEY and CHATBOT_ID must be set in .env.local" },
      { status: 500 }
    )
  }

  // The producer app sees the API key only on this backend-to-backend hop.
  let res: Response
  try {
    res = await fetch(`${widgetOrigin}/api/embed-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        // A real integration would derive this from the consumer app's authenticated user session.
        userId: "demo-user-001",
        chatbotId,
      }),
    })
  } catch {
    return Response.json(
      {
        error:
          "Cannot reach the widget producer app. Start widget-producer-app (e.g. port 3000) and ensure NEXT_PUBLIC_WIDGET_ORIGIN matches.",
      },
      { status: 503 }
    )
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }))
    return Response.json({ error: error.error ?? "Failed to fetch embed token" }, { status: res.status })
  }

  const data = await res.json()
  return Response.json({ token: data.token })
}
