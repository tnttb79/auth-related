"use client"

// Chat UI rendered by the widget producer origin inside a widget consumer-owned iframe.
// This page completes the browser side of the handshake: announce readiness,
// accept an embed token from the parent window, exchange it for a cookie-backed
// session, then send chat requests with that session.

import { useEffect, useRef, useState } from "react"

type Message = { from: "user" | "bot"; text: string }
type WidgetState = "waiting" | "authing" | "ready" | "error"
// In production this would usually come from tenant configuration.
const CONSUMER_APP_ORIGIN =
  process.env.NEXT_PUBLIC_CONSUMER_APP_ORIGIN ??
  process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN ??
  "http://localhost:3001"

export default function WidgetPage() {
  const [state, setState] = useState<WidgetState>("waiting")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // The parent should not send auth data until the iframe has mounted and is listening.
    window.parent.postMessage({ type: "READY" }, CONSUMER_APP_ORIGIN)

    function handleWidgetAuth(e: MessageEvent) {
      // Accept messages only from the configured widget consumer app origin.
      if (e.origin !== CONSUMER_APP_ORIGIN) return
      if (e.data?.type !== "AUTH") return

      const token: string = e.data.token
      if (!token) {
        setState("error")
        return
      }

      // Convert the short-lived embed token into a durable HttpOnly session cookie.
      setState("authing")
      fetch("/api/widget-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedToken: token }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Auth failed")
          setState("ready")
        })
        .catch(() => setState("error"))
    }

    window.addEventListener("message", handleWidgetAuth)
    return () => window.removeEventListener("message", handleWidgetAuth)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return

    setInput("")
    setMessages((prev) => [...prev, { from: "user", text }])
    setSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { from: "bot", text: data.message ?? data.error }])
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Something went wrong." }])
    } finally {
      setSending(false)
    }
  }

  if (state === "waiting" || state === "authing") {
    return (
      <div style={styles.centered}>
        <p style={styles.statusText}>
          {state === "waiting" ? "Connecting…" : "Authenticating…"}
        </p>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div style={styles.centered}>
        <p style={{ ...styles.statusText, color: "#c0392b" }}>
          Authentication failed. This widget is not authorized to load here.
        </p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Support Chat</div>

      <div style={styles.messageList}>
        {messages.length === 0 && (
          <p style={styles.placeholder}>Send a message to start the conversation.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={msg.from === "user" ? styles.userMsg : styles.botMsg}>
            {msg.text}
          </div>
        ))}
        {/* Sentinel node used to keep the latest message in view. */}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button style={styles.button} onClick={sendMessage} disabled={sending}>
          Send
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    fontSize: 14,
    background: "#fff",
  },
  header: {
    background: "#1a1a2e",
    color: "#fff",
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: 15,
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  placeholder: {
    color: "#999",
    textAlign: "center",
    marginTop: 40,
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "#1a1a2e",
    color: "#fff",
    borderRadius: "12px 12px 2px 12px",
    padding: "8px 12px",
    maxWidth: "80%",
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "#f0f0f0",
    color: "#222",
    borderRadius: "12px 12px 12px 2px",
    padding: "8px 12px",
    maxWidth: "80%",
  },
  inputRow: {
    display: "flex",
    borderTop: "1px solid #eee",
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #ddd",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
  },
  button: {
    padding: "8px 14px",
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: 16,
  },
  statusText: {
    color: "#666",
    textAlign: "center",
  },
}
