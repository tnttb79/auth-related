import Link from "next/link"
import styles from "./architecture.module.css"

const flowSteps = [
  {
    number: "1",
    position: "stepOne",
    title: "Page asks for an embed token",
    body: "The browser calls the consumer backend instead of talking to the producer with a long-lived secret.",
  },
  {
    number: "2",
    position: "stepTwo",
    title: "Consumer backend proves the site",
    body: "The server sends x-api-key to the producer. The raw API key never enters the browser.",
  },
  {
    number: "3",
    position: "stepThree",
    title: "Producer signs a short-lived JWT",
    body: "The producer validates the hashed key, resolves the website and chatbot, then returns a 60-second embed token.",
  },
  {
    number: "4",
    position: "stepFour",
    title: "Parent sends AUTH to the iframe",
    body: "The iframe sends READY, then the parent replies with the token through postMessage and a strict target origin.",
  },
  {
    number: "5",
    position: "stepFive",
    title: "Iframe exchanges token for a session",
    body: "The producer verifies the JWT and sets an HttpOnly cookie for the widget chat session.",
  },
  {
    number: "6",
    position: "stepSix",
    title: "Chat and dashboard use producer state",
    body: "Messages, sessions, presence, API key metadata, and owner replies all stay in the producer app.",
  },
]

export default function ArchitecturePage() {
  return (
    <main className={styles.page}>
      <div className={styles.gridBackdrop} />

      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            Back to demo
          </Link>
          <span className={styles.routePill}>/architecture</span>
        </nav>

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Iframe authentication architecture</p>
            <h1 className={styles.heading}>Consumer to producer auth flow</h1>
          </div>
          <p className={styles.body}>
            The demo separates the customer site from the widget provider. The
            consumer app never exposes its API key to the browser, while the
            producer owns the iframe, session cookie, chat APIs, dashboard, and data.
          </p>
        </div>
      </header>

      <section className={styles.diagramSection} aria-label="Authentication flow diagram">
        <div className={styles.diagramHeader}>
          <div>
            <span>Consumer origin</span>
            <strong>Customer app</strong>
          </div>
          <div>
            <span>Producer origin</span>
            <strong>Widget provider</strong>
          </div>
        </div>

        <div className={styles.diagram}>
          {flowSteps.map((step) => (
            <article
              key={step.number}
              className={`${styles.flowStep} ${styles[step.position]}`}
            >
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepText}>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
