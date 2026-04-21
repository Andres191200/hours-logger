'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.scss'

const tabs = [
  {
    href: '/load',
    label: 'Log',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/metrics',
    label: 'Stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.75" />
        <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.75" />
        <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.inner}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href === '/load' && pathname === '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
