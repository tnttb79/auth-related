"use client"

// Widget consumer app wrapper around the producer iframe.
// In this demo the API key is typed into the page and held in memory only. A
// real consumer app would keep that key on the server, usually in an env file.
// This component exchanges the key for a short-lived embed token, waits for the
// iframe to signal readiness, then sends the token with postMessage.

import { useEffect, useRef, useState } from "react"

const WIDGET_ORIGIN = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "http://localhost:3000"
const WIDGET_URL = `${WIDGET_ORIGIN}/widget`

type ChatWidgetProps = {
  apiKey: string | null
}

export default function ChatWidget({ apiKey }: ChatWidgetProps) {
  if (!apiKey) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyTitle}>Chat iframe preview</p>
        <p style={styles.emptyText}>Paste an API key and load the chat to start the demo.</p>
      </div>
    )
  }

  return <AuthenticatedChatWidget key={apiKey} apiKey={apiKey} />
}

function AuthenticatedChatWidget({ apiKey }: { apiKey: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [token, setToken] = useState<string | null>(null)
  const [iframeReady, setIframeReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/get-embed-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          token?: string
        }

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to fetch embed token")
        }
        if (!data.token) {
          throw new Error("Token response did not include a token")
        }

        setToken(data.token)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to load chat")
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [apiKey])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // Ignore messages from any window except the configured widget origin.
      if (e.origin !== WIDGET_ORIGIN) return
      if (e.data?.type === "READY") setIframeReady(true)
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    if (!token || !iframeReady || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      { type: "AUTH", token },
      WIDGET_ORIGIN // targetOrigin limits delivery to the expected widget origin.
    )
  }, [token, iframeReady])

  if (error) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.errorTitle}>Could not load chat</p>
        <p style={styles.emptyText}>{error}</p>
      </div>
    )
  }

  return (
    <div style={styles.frameShell}>
      {loading ? <div style={styles.loading}>Loading chat...</div> : null}
      <iframe ref={iframeRef} src={WIDGET_URL} style={styles.iframe} title="Support Chat" />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  frameShell: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 520,
  },
  iframe: {
    width: "100%",
    height: "100%",
    minHeight: 520,
    border: "none",
  },
  loading: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    display: "grid",
    placeItems: "center",
    background: "#08090f",
    color: "#b9c2d3",
    fontFamily: "system-ui, sans-serif",
    fontSize: 14,
  },
  emptyState: {
    height: "100%",
    minHeight: 520,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 28,
    textAlign: "center",
    fontFamily: "system-ui, sans-serif",
    background: "#08090f",
  },
  emptyTitle: {
    color: "#f7f8fb",
    fontSize: 18,
    fontWeight: 700,
  },
  errorTitle: {
    color: "#ff9d9d",
    fontSize: 18,
    fontWeight: 700,
  },
  emptyText: {
    maxWidth: 300,
    color: "#9fa9bb",
    fontSize: 14,
    lineHeight: 1.5,
  },
}
