"use client"

// Website detail: shows API keys + live chat sessions. Key creation reveals
// the raw key exactly once in a modal. Sessions auto-refresh every few seconds
// so new visitors appear without a manual reload.

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import DashboardFrame from "../../DashboardFrame"
import styles from "../../dashboard.module.css"

type Website = { id: string; name: string; domain: string; chatbot: { id: string; name: string } | null }
type ApiKey = {
  id: string
  label: string
  prefix: string
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}
type SessionRow = {
  id: string
  createdAt: string
  lastSeenAt: string
  isOnline: boolean
  messageCount: number
  lastMessage: { body: string; role: string; createdAt: string } | null
}

const SESSIONS_REFRESH_MS = 3000

export default function WebsiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [website, setWebsite] = useState<Website | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [newLabel, setNewLabel] = useState("")
  const [revealedKey, setRevealedKey] = useState<{ raw: string; prefix: string; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadWebsite = useCallback(async () => {
    const res = await fetch(`/api/dashboard/websites/${id}`)
    if (res.ok) {
      const data = await res.json()
      setWebsite(data.website)
    }
  }, [id])

  const loadKeys = useCallback(async () => {
    const res = await fetch(`/api/dashboard/websites/${id}/keys`)
    if (res.ok) {
      const data = await res.json()
      setKeys(data.keys)
    }
  }, [id])

  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/dashboard/websites/${id}/sessions`)
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions)
    }
  }, [id])

  useEffect(() => {
    loadWebsite()
    loadKeys()
    loadSessions()
  }, [loadWebsite, loadKeys, loadSessions])

  useEffect(() => {
    const interval = window.setInterval(loadSessions, SESSIONS_REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [loadSessions])

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`/api/dashboard/websites/${id}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Create failed" }))
      setError(data.error ?? "Create failed")
      return
    }
    const data = await res.json()
    setRevealedKey({ raw: data.raw, prefix: data.prefix, label: data.label })
    setNewLabel("")
    await loadKeys()
  }

  async function revokeKey(keyId: string) {
    const res = await fetch(`/api/dashboard/websites/${id}/keys/${keyId}`, {
      method: "DELETE",
    })
    if (res.ok) loadKeys()
  }

  return (
    <DashboardFrame>
      <Link href="/dashboard" className={styles.backLink}>
        ← all websites
      </Link>
      {website && (
        <>
          <h1 className={styles.pageTitle}>{website.name}</h1>
          <p className={styles.pageLead}>
            {website.domain}
            {website.chatbot ? ` · chatbot “${website.chatbot.name}”` : ""}
          </p>
        </>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>API keys</span>
        </div>

        <div className={styles.card}>
          <form onSubmit={createKey} className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="label (e.g. production)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={40}
              required
            />
            <button className={styles.button} type="submit">
              Create key
            </button>
          </form>
          {error && <p className={styles.inlineError}>{error}</p>}
        </div>

        {keys.length === 0 ? (
          <div className={styles.empty} style={{ marginTop: 14 }}>
            No keys yet. Create one above — you&apos;ll see the raw value once.
          </div>
        ) : (
          <div className={styles.list} style={{ marginTop: 14 }}>
            {keys.map((k) => (
              <div key={k.id} className={styles.listRow}>
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>
                    {k.label}
                    {k.revokedAt ? " · revoked" : ""}
                  </span>
                  <span className={styles.listSub}>
                    <span className={styles.keyMono}>{k.prefix}…</span> · last
                    used {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}
                  </span>
                </div>
                {!k.revokedAt && (
                  <button
                    className={styles.buttonDanger}
                    onClick={() => revokeKey(k.id)}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>
            Chat sessions ({sessions.length})
          </span>
        </div>
        {sessions.length === 0 ? (
          <div className={styles.empty}>
            No sessions yet. Load the widget on your site to start one.
          </div>
        ) : (
          <div className={styles.list}>
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/websites/${id}/sessions/${s.id}`}
                className={styles.listRow}
              >
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>
                    {s.lastMessage?.body?.slice(0, 80) ?? "(no messages yet)"}
                  </span>
                  <span className={styles.listSub}>
                    {s.messageCount} message{s.messageCount === 1 ? "" : "s"} ·
                    started {new Date(s.createdAt).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`${styles.statusPill} ${
                    s.isOnline ? styles.statusOnline : styles.statusStale
                  }`}
                >
                  <span
                    className={`${styles.dot} ${
                      s.isOnline ? styles.dotOnline : styles.dotStale
                    }`}
                  />
                  {s.isOnline ? "online" : "stale"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {revealedKey && (
        <div className={styles.modalBackdrop} onClick={() => setRevealedKey(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Copy this key now</h2>
            <p className={styles.modalBody}>
              This is the only time <strong>{revealedKey.label}</strong> will
              ever be visible. Store it somewhere safe — we only keep the hash.
            </p>
            <div className={styles.secretBox}>{revealedKey.raw}</div>
            <div className={styles.modalActions}>
              <button
                className={styles.buttonGhost}
                onClick={() => navigator.clipboard?.writeText(revealedKey.raw)}
              >
                Copy
              </button>
              <button
                className={styles.button}
                onClick={() => setRevealedKey(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardFrame>
  )
}
