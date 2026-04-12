"use client"

// Session detail: message thread + reply composer. Polls for both new messages
// and the online/stale status so the composer disables itself when the visitor
// drops off. The server also enforces the online check when posting.

import { use, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import DashboardFrame from "../../../../DashboardFrame"
import styles from "../../../../dashboard.module.css"

type Message = {
  id: string
  role: "visitor" | "owner"
  body: string
  createdAt: string
}

const REFRESH_MS = 2000

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const { id, sessionId } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard/sessions/${sessionId}/messages`)
    if (!res.ok) return
    const data = (await res.json()) as {
      messages: Message[]
      session: { isOnline: boolean }
    }
    setMessages(data.messages)
    setIsOnline(data.session.isOnline)
  }, [sessionId])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [load])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [messages])

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    const text = reply.trim()
    if (!text || sending || !isOnline) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/dashboard/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Send failed" }))
        if (data.error === "session_stale") {
          setIsOnline(false)
          setError("Visitor went offline before the reply could be delivered.")
        } else {
          setError(data.error ?? "Send failed")
        }
        return
      }
      setReply("")
      load()
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardFrame>
      <Link href={`/dashboard/websites/${id}`} className={styles.backLink}>
        ← back to website
      </Link>

      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Session</h1>
        <span
          className={`${styles.statusPill} ${
            isOnline ? styles.statusOnline : styles.statusStale
          }`}
        >
          <span
            className={`${styles.dot} ${
              isOnline ? styles.dotOnline : styles.dotStale
            }`}
          />
          {isOnline ? "online" : "stale"}
        </span>
      </div>
      <p className={styles.pageLead}>
        {messages.length} message{messages.length === 1 ? "" : "s"} · refreshes
        every {REFRESH_MS / 1000}s
      </p>

      <div className={styles.thread} ref={threadRef}>
        {messages.length === 0 ? (
          <p className={styles.empty} style={{ border: "none", background: "transparent" }}>
            No messages yet.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "owner" ? styles.bubbleOwner : styles.bubbleVisitor}
            >
              {m.body}
            </div>
          ))
        )}
      </div>

      {isOnline ? (
        <form onSubmit={sendReply} className={styles.composer}>
          <input
            className={styles.input}
            placeholder="Type a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={sending}
          />
          <button className={styles.button} type="submit" disabled={sending || !reply.trim()}>
            Send
          </button>
        </form>
      ) : (
        <div className={styles.composerDisabled}>
          Visitor is offline — can&apos;t reply to a closed session.
        </div>
      )}
      {error && <p className={styles.inlineError}>{error}</p>}
    </DashboardFrame>
  )
}
