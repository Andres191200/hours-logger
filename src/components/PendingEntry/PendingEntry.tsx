'use client'
import { motion } from 'motion/react'
import { formatMinutes } from '@/lib/dates'
import type { PendingEntry as PendingEntryType } from '@/types'
import styles from './PendingEntry.module.scss'

interface PendingEntryProps {
  entry: PendingEntryType
  onRemove: (id: string) => void
}

export function PendingEntry({ entry, onRemove }: PendingEntryProps) {
  return (
    <motion.div
      className={styles.row}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <div className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{entry.label}</span>
      <span className={styles.duration}>{formatMinutes(entry.minutes)}</span>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(entry.id)}
        aria-label={`Remove ${entry.label}`}
        title="Remove"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  )
}
