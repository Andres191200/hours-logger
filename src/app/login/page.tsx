import { signIn } from '@/lib/auth'
import styles from './login.module.scss'

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="var(--color-accent)" fillOpacity="0.15" />
            <rect x="1" y="1" width="38" height="38" rx="9" stroke="var(--color-accent)" strokeOpacity="0.3" strokeWidth="1" />
            <path
              d="M12 20h6m0 0v-6m0 6v6m0-6h10"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.logoText}>Hourly Load</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to log your hours</p>

        <form
          action={async () => {
            'use server'
            await signIn('zitadel', { redirectTo: '/load' })
          }}
        >
          <button type="submit" className={styles.signInBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                fill="currentColor"
              />
            </svg>
            Sign in with Zitadel
          </button>
        </form>
      </div>
    </main>
  )
}
