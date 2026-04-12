"use client"

// Shared chrome (banner + topbar + content wrapper) for all dashboard pages
// except the login screen. Also handles the auth bounce: if /api/dashboard/me
// returns 401 we push the user to /dashboard/login.

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import styles from "./dashboard.module.css"

export default function DashboardFrame({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard/me")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/dashboard/login")
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (data) setName(data.name)
        setChecked(true)
      })
      .catch(() => setChecked(true))
  }, [router])

  async function logout() {
    await fetch("/api/dashboard/logout", { method: "POST" })
    router.replace("/dashboard/login")
  }

  if (!checked || !name) {
    return (
      <div className={styles.shell}>
        <div className={styles.banner}>
          Toy project · no real auth · pick a name and go
        </div>
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.banner}>
        Toy project · no real auth · pick a name and go
      </div>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          WIDGET<span>·</span>PRODUCER
        </div>
        <div className={styles.whoami}>
          <span>
            signed in as <strong>{name}</strong>
          </span>
          <button className={styles.buttonGhost} onClick={logout}>
            Log out
          </button>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
