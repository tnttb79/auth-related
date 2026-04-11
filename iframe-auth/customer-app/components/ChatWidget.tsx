"use client"

// Widget consumer app wrapper around the producer iframe.
// It fetches an embed token from the consumer backend, waits for the iframe to
// signal readiness, then sends the token with postMessage instead of exposing it in the URL.

import { useEffect, useRef, useState } from "react"

const WIDGET_ORIGIN = process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? "http://localhost:3000"
const WIDGET_URL = `${WIDGET_ORIGIN}/widget`

export default function ChatWidget() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [token, setToken] = useState<string | null>(null)
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    fetch("/api/get-embed-token")
      .then(async (res) => {
        const text = await res.text()
        if (!res.ok) {
          console.error("get-embed-token failed:", res.status, text)
          return
        }
        try {
          const data = JSON.parse(text) as { token?: string }
          if (data.token) setToken(data.token)
        } catch {
          console.error("get-embed-token: invalid JSON body")
        }
      })
      .catch(console.error)
  }, [])

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

  return (
    <iframe
      ref={iframeRef}
      src={WIDGET_URL}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: 12,
      }}
      title="Support Chat"
    />
  )
}
