"use client"

// Name-only login. Intentionally not a real auth system — this is a toy project.
// The banner above the form makes that obvious.

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../dashboard.module.css"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Login failed" }))
        setError(data.error ?? "Login failed")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          WIDGET<span>·</span>PRODUCER
        </div>
        <h1 className={styles.loginHead}>Hey there.</h1>
        <p className={styles.loginHint}>
          Toy project — no real auth. Type any name to continue. If that name
          already exists you&apos;ll be taken to its workspace.
        </p>
        <form onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <input
              className={styles.input}
              placeholder="your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={40}
            />
            <button className={styles.button} type="submit" disabled={submitting}>
              Continue
            </button>
          </div>
          {error && <p className={styles.inlineError}>{error}</p>}
        </form>
      </div>
    </div>
  )
}
