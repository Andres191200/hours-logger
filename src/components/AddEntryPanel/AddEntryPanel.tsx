'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TargetSearch } from '@/components/TargetSearch/TargetSearch'
import { ActivityPicker } from '@/components/ActivityPicker/ActivityPicker'
import { TimeSelector } from '@/components/TimeSelector/TimeSelector'
import type { PersonObjective, SearchTarget, ActivityType, PendingEntry } from '@/types'
import styles from './AddEntryPanel.module.scss'

interface AddEntryPanelProps {
  personId: number
  objectives: PersonObjective[]
  onAdd: (entry: PendingEntry) => void
}

type Step =
  | { name: 'search' }
  | { name: 'objective'; target: Extract<SearchTarget, { kind: 'objective' }> }
  | { name: 'project-activity'; target: Extract<SearchTarget, { kind: 'project' }> }
  | { name: 'project-time'; target: Extract<SearchTarget, { kind: 'project' }>; activityType: ActivityType }

function buildLabel(target: SearchTarget, activityType?: ActivityType): string {
  if (target.kind === 'objective') {
    return `${target.title} · ${target.projectName}`
  }
  const activityLabels: Record<ActivityType, string> = {
    meeting: 'Meeting',
    'technical-discussion': 'Tech Discussion',
    'code-review': 'Code Review',
  }
  const activityLabel = activityType ? activityLabels[activityType] : ''
  return `${target.projectName}${activityLabel ? ` · ${activityLabel}` : ''}`
}

export function AddEntryPanel({ objectives, onAdd }: AddEntryPanelProps) {
  const [step, setStep] = useState<Step>({ name: 'search' })
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)

  const handleTargetSelect = useCallback((target: SearchTarget) => {
    if (target.kind === 'objective') {
      setStep({ name: 'objective', target })
    } else {
      setStep({ name: 'project-activity', target })
    }
    setHours(0)
    setMinutes(0)
  }, [])

  const handleActivitySelect = useCallback(
    (activityType: ActivityType) => {
      if (step.name === 'project-activity') {
        setStep({ name: 'project-time', target: step.target, activityType })
      }
    },
    [step]
  )

  const handleTimeChange = useCallback((h: number, m: number) => {
    setHours(h)
    setMinutes(m)
  }, [])

  const handleReset = useCallback(() => {
    setStep({ name: 'search' })
    setHours(0)
    setMinutes(0)
  }, [])

  const handleAdd = useCallback(() => {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes === 0) return

    let target: SearchTarget
    let activityType: ActivityType | undefined

    if (step.name === 'objective') {
      target = step.target
    } else if (step.name === 'project-time') {
      target = step.target
      activityType = step.activityType
    } else {
      return
    }

    const entry: PendingEntry = {
      id: crypto.randomUUID(),
      target,
      activityType,
      minutes: totalMinutes,
      label: buildLabel(target, activityType),
    }

    onAdd(entry)
    handleReset()
  }, [step, hours, minutes, onAdd, handleReset])

  const totalMinutes = hours * 60 + minutes
  const canAdd = totalMinutes > 0 && (step.name === 'objective' || step.name === 'project-time')

  const currentTarget =
    step.name === 'objective'
      ? step.target
      : step.name === 'project-activity'
      ? step.target
      : step.name === 'project-time'
      ? step.target
      : null

  const currentActivity = step.name === 'project-time' ? step.activityType : undefined

  return (
    <div className={styles.panel}>
      <TargetSearch
        objectives={objectives}
        onSelect={handleTargetSelect}
        disabled={step.name !== 'search'}
      />

      <AnimatePresence mode="wait">
        {currentTarget && (
          <motion.div
            key="selection-badge"
            className={styles.selectionBadge}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <span className={styles.badgeIcon}>
              {currentTarget.kind === 'objective' ? '📌' : '📁'}
            </span>
            <span className={styles.badgeLabel}>{buildLabel(currentTarget, currentActivity)}</span>
            <button className={styles.badgeReset} onClick={handleReset} aria-label="Clear selection">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step.name === 'project-activity' && (
          <motion.div
            key="activity-picker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <ActivityPicker
              projectName={step.target.projectName}
              onSelect={handleActivitySelect}
            />
          </motion.div>
        )}

        {(step.name === 'objective' || step.name === 'project-time') && (
          <motion.div
            key="time-selector"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={styles.timeSelectorWrap}
          >
            <TimeSelector hours={hours} minutes={minutes} onChange={handleTimeChange} />
            <button
              className={`${styles.addBtn} ${canAdd ? styles.addBtnEnabled : ''}`}
              onClick={handleAdd}
              disabled={!canAdd}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Add to queue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
