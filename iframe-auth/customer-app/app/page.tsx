// Demo widget consumer app page that embeds the producer-hosted widget.
// The auth handshake lives in ChatWidget; this page only provides host-site UI.

import ChatWidget from "@/components/ChatWidget"

export default function HomePage() {
  return (
    <div style={styles.layout}>
      <main style={styles.main}>
        <h1 style={styles.heading}>Acme Corp — Help Center</h1>
        <p style={styles.body}>
          Welcome to our help center. Browse the articles below or use the chat widget
          on the right to speak with our support bot.
        </p>
        <div style={styles.articleList}>
          {["Getting started", "Billing & payments", "Account settings", "API documentation"].map(
            (title) => (
              <div key={title} style={styles.articleCard}>
                <strong>{title}</strong>
                <p style={styles.articleExcerpt}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            )
          )}
        </div>
      </main>

      <aside style={styles.widgetContainer}>
        <ChatWidget />
      </aside>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f9f9f9",
  },
  main: {
    flex: 1,
    padding: "40px 48px",
    overflowY: "auto",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 12,
    color: "#1a1a2e",
  },
  body: {
    color: "#555",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  articleList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  articleCard: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: 20,
  },
  articleExcerpt: {
    color: "#888",
    fontSize: 13,
    marginTop: 6,
  },
  widgetContainer: {
    width: 360,
    flexShrink: 0,
    borderLeft: "1px solid #e5e5e5",
    background: "#fff",
  },
}
