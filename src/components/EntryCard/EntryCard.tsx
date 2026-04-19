'use client'
import { motion } from 'motion/react'
import { formatMinutes } from '@/lib/dates'
import styles from './EntryCard.module.scss'

interface EntryCardProps {
  ids: number[]
  title: string
  subtitle: string | null
  totalMinutes: number
  onDelete: (ids: number[]) => void
  isDeleting?: boolean
}

export function EntryCard({ ids, title, subtitle, totalMinutes, onDelete, isDeleting }: EntryCardProps) {
  return (
    <motion.div
      className={`${styles.card} ${isDeleting ? styles.cardDeleting : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <div className={styles.stripe} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <div className={styles.right}>
          <span className={styles.duration}>{formatMinutes(totalMinutes)}</span>
          <button
            className={styles.deleteBtn}
            onClick={() => onDelete(ids)}
            disabled={isDeleting}
            aria-label="Delete entry"
            title="Delete entry"
          >
            {isDeleting ? (
              <div className={styles.spinner} aria-hidden="true" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
