'use client'
import { useRef, useEffect, startTransition } from 'react'
import { formatDayLabel } from '@/lib/dates'
import styles from './DayStrip.module.scss'

interface DayStripProps {
  dates: string[]
  selectedDate: string
  onSelect: (date: string) => void
}

export function DayStrip({ dates, selectedDate, onSelect }: DayStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current
      const selected = selectedRef.current
      const containerRect = container.getBoundingClientRect()
      const selectedRect = selected.getBoundingClientRect()
      const scrollLeft = container.scrollLeft + selectedRect.left - containerRect.left - (containerRect.width - selectedRect.width) / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [selectedDate])

  const handleSelect = (date: string) => {
    startTransition(() => {
      onSelect(date)
    })
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div className={styles.track}>
        {[...dates].reverse().map((date) => {
          const { day, date: dateLabel, isToday } = formatDayLabel(date)
          const isSelected = date === selectedDate
          return (
            <button
              key={date}
              ref={isSelected ? selectedRef : null}
              className={`${styles.dayBtn} ${isSelected ? styles.dayBtnSelected : ''} ${isToday ? styles.dayBtnToday : ''}`}
              onClick={() => handleSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${day}, ${dateLabel}`}
            >
              <span className={styles.dayName}>{day}</span>
              <span className={styles.dateNum}>{dateLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
