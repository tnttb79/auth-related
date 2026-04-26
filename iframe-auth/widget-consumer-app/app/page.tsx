"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import ChatWidget from "@/components/ChatWidget"
import styles from "./page.module.css"

export default function HomePage() {
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedApiKey = apiKeyInput.trim()
    if (!trimmedApiKey) {
      setFormError("Paste an API key from the dashboard before loading the chat.")
      setActiveApiKey(null)
      return
    }

    setFormError(null)
    setActiveApiKey(trimmedApiKey)
  }

  function handleClear() {
    setApiKeyInput("")
    setActiveApiKey(null)
    setFormError(null)
  }

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} />
      <section className={styles.panel}>
        <div>
          <p className={styles.kicker}>Consumer app demo</p>
          <h1 className={styles.heading}>Test the embedded chat iframe</h1>
          <p className={styles.body}>
            This is a minimal shell for testing how a website can embed the chat
            iframe from the producer app.
          </p>
          <p className={styles.body}>
            Retrieve an API key from the{" "}
            <a
              href="https://auth-iframe-producer.onrender.com"
              target="_blank"
              rel="noreferrer"
              className={styles.inlineLink}
            >
              producer dashboard
            </a>
            , paste it here, and load the widget. For this demo, the key is held
            in browser memory only. In a normal integration, the consumer app
            would keep this key in its server environment, such as{" "}
            <code className={styles.code}>.env.local</code>.
          </p>
          <div className={styles.instructionActions}>
            <a
              href="https://auth-iframe-producer.onrender.com"
              target="_blank"
              rel="noreferrer"
              className={styles.dashboardLink}
            >
              Open producer dashboard
            </a>
            <Link href="/architecture" className={styles.architectureLink}>
              View architecture
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <label htmlFor="api-key" className={styles.label}>
              Dashboard API key
            </label>
            <span className={styles.memoryBadge}>Memory only</span>
          </div>
          <input
            id="api-key"
            type="password"
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            placeholder="Paste dashboard API key"
            autoComplete="off"
            spellCheck={false}
            className={styles.input}
          />

          {formError ? <p className={styles.error}>{formError}</p> : null}
          {activeApiKey ? (
            <p className={styles.status}>
              API key loaded in memory. Refreshing the page will clear it.
            </p>
          ) : null}

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton}>
              Load chat
            </button>
            <button type="button" onClick={handleClear} className={styles.secondaryButton}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className={styles.previewSection} aria-label="Embedded chat widget preview">
        <div className={styles.previewHeader}>
          <div>
            <p className={styles.previewKicker}>Live preview</p>
            <h2 className={styles.previewTitle}>Producer iframe</h2>
          </div>
          <span className={activeApiKey ? styles.liveBadge : styles.idleBadge}>
            {activeApiKey ? "Connected" : "Waiting for key"}
          </span>
        </div>
        <div className={styles.widgetPanel}>
          <ChatWidget apiKey={activeApiKey} />
        </div>
      </section>
    </main>
  )
}
