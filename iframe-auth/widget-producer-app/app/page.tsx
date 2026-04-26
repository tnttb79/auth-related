import Link from "next/link"

export default function Home() {
  return (
    <div style={styles.wrap}>
      <main style={styles.card}>
        <div style={styles.brand}>
          WIDGET<span style={{ color: "var(--accent)" }}>·</span>PRODUCER
        </div>
        <h1 style={styles.h1}>Embeddable chat, on your terms.</h1>
        <p style={styles.body}>
          This app hosts the iframe widget, issues short-lived embed tokens,
          and stores chat sessions. The dashboard lets you manage websites,
          generate API keys, and reply to visitors in real time.
        </p>
        <div style={styles.actions}>
          <Link href="/dashboard" style={styles.primary}>
            Open dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    color: "var(--text)",
    padding: 20,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    maxWidth: 520,
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: 44,
  },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 20,
  },
  h1: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: -0.8,
    lineHeight: 1.15,
    marginBottom: 16,
  },
  body: {
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 28,
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primary: {
    background: "var(--accent)",
    color: "var(--bg)",
    padding: "11px 20px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    textDecoration: "none",
    borderRadius: 4,
  },
  secondary: {
    color: "var(--text)",
    border: "1px solid var(--border)",
    padding: "11px 20px",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    borderRadius: 4,
  },
}
