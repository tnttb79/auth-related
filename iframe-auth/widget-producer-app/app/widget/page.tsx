"use client"

// Chat UI rendered by the widget producer origin inside a consumer-owned iframe.
// Completes the browser side of the handshake (READY → AUTH → session cookie),
// then polls /api/chat/messages for owner replies. Messages are persisted on the
// producer, so refresh still shows the ongoing thread (until the tab closes).

import { notFound } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

type Message = {
  id: string
  role: "visitor" | "owner"
  body: string
  createdAt: string
}
type WidgetState = "waiting" | "authing" | "ready" | "error"

const CONSUMER_APP_ORIGIN =
  process.env.NEXT_PUBLIC_CONSUMER_APP_ORIGIN ??
  process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN ??
  "http://localhost:3001"
const POLL_INTERVAL_MS = 2000

export default function WidgetPage() {
  const [state, setState] = useState<WidgetState>("waiting")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSeenAtRef = useRef<string>(new Date(0).toISOString())

  useLayoutEffect(() => {
    if (window.self === window.top) {
      notFound()
    }
  }, [])

  useEffect(() => {
    window.parent.postMessage({ type: "READY" }, CONSUMER_APP_ORIGIN)

    function handleWidgetAuth(e: MessageEvent) {
      if (e.origin !== CONSUMER_APP_ORIGIN) return
      if (e.data?.type !== "AUTH") return

      const token: string = e.data.token
      if (!token) {
        setState("error")
        return
      }

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

  // Merge new messages into state while preserving client-ordering and deduping by id.
  const mergeMessages = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id))
      const next = [...prev]
      for (const m of incoming) {
        if (!seen.has(m.id)) next.push(m)
      }
      return next
    })
    const newest = incoming[incoming.length - 1]
    if (newest && newest.createdAt > lastSeenAtRef.current) {
      lastSeenAtRef.current = newest.createdAt
    }
  }, [])

  // Polling loop: hits /api/chat/messages every POLL_INTERVAL_MS once auth is ready.
  useEffect(() => {
    if (state !== "ready") return

    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(
          `/api/chat/messages?since=${encodeURIComponent(lastSeenAtRef.current)}`,
        )
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { messages: Message[] }
        if (!cancelled) mergeMessages(data.messages)
      } catch {
        // Polling is best-effort; swallow transient errors.
      }
    }

    poll()
    const id = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [state, mergeMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending) return

    setInput("")
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const data = (await res.json()) as { messageId: string; createdAt: string }
        // Optimistically append; the next poll will dedupe it by id.
        mergeMessages([
          { id: data.messageId, role: "visitor", body: text, createdAt: data.createdAt },
        ])
      }
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
        <p style={{ ...styles.statusText, color: "#ff6b6b" }}>
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
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={msg.role === "visitor" ? styles.visitorMsg : styles.ownerMsg}
          >
            {msg.body}
          </div>
        ))}
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
    background: "#0b0b0f",
    color: "#e5e5ec",
  },
  header: {
    background: "#14141b",
    color: "#e5e5ec",
    padding: "14px 16px",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: 0.3,
    borderBottom: "1px solid #1f1f2a",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  placeholder: {
    color: "#7a7a8c",
    textAlign: "center",
    marginTop: 40,
    fontSize: 13,
  },
  visitorMsg: {
    alignSelf: "flex-end",
    background: "#b4ff39",
    color: "#0b0b0f",
    borderRadius: 4,
    padding: "8px 12px",
    maxWidth: "80%",
    fontWeight: 500,
  },
  ownerMsg: {
    alignSelf: "flex-start",
    background: "#1f1f2a",
    color: "#e5e5ec",
    borderRadius: 4,
    padding: "8px 12px",
    maxWidth: "80%",
  },
  inputRow: {
    display: "flex",
    borderTop: "1px solid #1f1f2a",
    padding: 10,
    gap: 8,
    background: "#14141b",
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    background: "#0b0b0f",
    border: "1px solid #1f1f2a",
    borderRadius: 4,
    fontSize: 14,
    outline: "none",
    color: "#e5e5ec",
  },
  button: {
    padding: "8px 14px",
    background: "#b4ff39",
    color: "#0b0b0f",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#0b0b0f",
    padding: 16,
  },
  statusText: {
    color: "#7a7a8c",
    textAlign: "center",
  },
}
