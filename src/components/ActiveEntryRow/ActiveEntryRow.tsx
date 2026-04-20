'use client'
import { motion } from 'motion/react'
import { TimeSelector } from '@/components/TimeSelector/TimeSelector'
import type { ActiveEntry } from '@/types'
import styles from './ActiveEntryRow.module.scss'

interface ActiveEntryRowProps {
  entry: ActiveEntry
  onChange: (id: string, hours: number, minutes: number) => void
  onRemove: (id: string) => void
}

export function ActiveEntryRow({ entry, onChange, onRemove }: ActiveEntryRowProps) {
  return (
    <motion.div
      className={styles.row}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <div className={styles.badge}>
        <span className={styles.badgeIcon}>
          {entry.target.kind === 'objective' ? '📌' : '📁'}
        </span>
        <span className={styles.badgeLabel}>{entry.label}</span>
        <button
          className={styles.removeBtn}
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove ${entry.label}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <TimeSelector
        hours={entry.hours}
        minutes={entry.minutes}
        onChange={(h, m) => onChange(entry.id, h, m)}
      />
    </motion.div>
  )
}
