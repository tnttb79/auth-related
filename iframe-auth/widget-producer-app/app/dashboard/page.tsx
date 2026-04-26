"use client"

// Dashboard home: list of websites for the current owner + an inline add form.

import { useEffect, useState } from "react"
import Link from "next/link"
import DashboardFrame from "./DashboardFrame"
import styles from "./dashboard.module.css"

type Website = {
  id: string
  name: string
  domain: string
  createdAt: string
  chatbot: { id: string; name: string } | null
  _count: { apiKeys: number }
}

export default function DashboardHome() {
  const [websites, setWebsites] = useState<Website[] | null>(null)
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const res = await fetch("/api/dashboard/websites")
    if (!res.ok) return
    const data = (await res.json()) as { websites: Website[] }
    setWebsites(data.websites)
  }

  useEffect(() => {
    load()
  }, [])

  async function createWebsite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Create failed" }))
        setError(data.error ?? "Create failed")
        return
      }
      setName("")
      setDomain("")
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardFrame>
      <h1 className={styles.pageTitle}>Websites</h1>
      <p className={styles.pageLead}>
        Each website auto-provisions one chatbot and can hold multiple API keys.
      </p>

      <div className={styles.card}>
        <form onSubmit={createWebsite} className={styles.formRow}>
          <input
            className={styles.input}
            placeholder="website name (e.g. Cooking Blog)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
          <div className={styles.fieldGroup}>
            <input
              className={styles.input}
              placeholder="Site origin (e.g. cookingblog.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              maxLength={253}
              required
            />
            <span className={styles.fieldHint}>
              Where the widget will be embedded — hostname or full URL accepted
              (e.g. cookingblog.com · http://localhost:3001 · myapp.onrender.com)
            </span>
          </div>
          <button className={styles.button} type="submit" disabled={submitting}>
            Add
          </button>
        </form>
        {error && <p className={styles.inlineError}>{error}</p>}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>
            Registered ({websites?.length ?? 0})
          </span>
        </div>
        {websites === null ? null : websites.length === 0 ? (
          <div className={styles.empty}>No websites yet. Add one above.</div>
        ) : (
          <div className={styles.list}>
            {websites.map((w) => (
              <Link
                key={w.id}
                href={`/dashboard/websites/${w.id}`}
                className={styles.listRow}
              >
                <div className={styles.listMeta}>
                  <span className={styles.listTitle}>{w.name}</span>
                  <span className={styles.listSub}>
                    {w.domain} · {w._count.apiKeys} API key
                    {w._count.apiKeys === 1 ? "" : "s"}
                  </span>
                </div>
                <span className={styles.keyMono}>→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardFrame>
  )
}
