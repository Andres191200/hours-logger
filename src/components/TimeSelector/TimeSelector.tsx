'use client'
import { motion, AnimatePresence } from 'motion/react'
import { formatMinutes } from '@/lib/dates'
import styles from './TimeSelector.module.scss'

interface TimeSelectorProps {
  hours: number
  minutes: number
  onChange: (h: number, m: number) => void
}

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6]
const MINUTE_OPTIONS = [0, 15, 30, 45]

export function TimeSelector({ hours, minutes, onChange }: TimeSelectorProps) {
  const totalMinutes = hours * 60 + minutes
  const hasValue = totalMinutes > 0

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Hours</span>
        <div className={styles.btnGroup}>
          {HOUR_OPTIONS.map((h) => (
            <motion.button
              key={h}
              className={`${styles.btn} ${hours === h ? styles.btnSelected : ''}`}
              onClick={() => onChange(h, minutes)}
              whileTap={{ scale: 0.95 }}
              aria-pressed={hours === h}
            >
              {h}
            </motion.button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Min</span>
        <div className={styles.btnGroup}>
          {MINUTE_OPTIONS.map((m) => (
            <motion.button
              key={m}
              className={`${styles.btn} ${minutes === m ? styles.btnSelected : ''}`}
              onClick={() => onChange(hours, m)}
              whileTap={{ scale: 0.95 }}
              aria-pressed={minutes === m}
            >
              {String(m).padStart(2, '0')}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {hasValue && (
          <motion.div
            key={totalMinutes}
            className={styles.summary}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            <span className={styles.summaryTime}>{formatMinutes(totalMinutes)}</span>
            <span className={styles.summaryLabel}>selected</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
