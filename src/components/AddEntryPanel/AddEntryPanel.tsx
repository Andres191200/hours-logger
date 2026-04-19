'use client'
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
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
  onValidChange?: (valid: boolean) => void
}

export interface AddEntryPanelHandle {
  flushCurrent(): PendingEntry | null
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

function buildEntry(step: Step, hours: number, minutes: number): PendingEntry | null {
  const totalMinutes = hours * 60 + minutes
  if (totalMinutes === 0) return null
  if (step.name !== 'objective' && step.name !== 'project-time') return null

  const target = step.target
  const activityType = step.name === 'project-time' ? step.activityType : undefined

  return {
    id: crypto.randomUUID(),
    target,
    activityType,
    minutes: totalMinutes,
    label: buildLabel(target, activityType),
  }
}

export const AddEntryPanel = forwardRef<AddEntryPanelHandle, AddEntryPanelProps>(
  ({ objectives, onAdd, onValidChange }, ref) => {
    const [step, setStep] = useState<Step>({ name: 'search' })
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)

    const isReadyToCommit =
      (step.name === 'objective' || step.name === 'project-time') &&
      hours * 60 + minutes > 0

    // Notify parent whenever validity changes
    useEffect(() => {
      onValidChange?.(isReadyToCommit)
    }, [isReadyToCommit, onValidChange])

    const handleReset = useCallback(() => {
      setStep({ name: 'search' })
      setHours(0)
      setMinutes(0)
    }, [])

    // Expose flushCurrent so HoursPage can commit the in-progress entry on save
    useImperativeHandle(ref, () => ({
      flushCurrent(): PendingEntry | null {
        const entry = buildEntry(step, hours, minutes)
        if (entry) handleReset()
        return entry
      },
    }), [step, hours, minutes, handleReset])

    const handleTargetSelect = useCallback(
      (target: SearchTarget) => {
        // Auto-commit current in-progress entry before switching target
        const entry = buildEntry(step, hours, minutes)
        if (entry) onAdd(entry)

        setHours(0)
        setMinutes(0)

        if (target.kind === 'objective') {
          setStep({ name: 'objective', target })
        } else {
          setStep({ name: 'project-activity', target })
        }
      },
      [step, hours, minutes, onAdd]
    )

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

    const currentTarget =
      step.name === 'objective' || step.name === 'project-activity' || step.name === 'project-time'
        ? step.target
        : null

    const currentActivity = step.name === 'project-time' ? step.activityType : undefined

    return (
      <div className={styles.panel}>
        <TargetSearch
          objectives={objectives}
          onSelect={handleTargetSelect}
          disabled={step.name === 'project-activity'}
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
            >
              <TimeSelector hours={hours} minutes={minutes} onChange={handleTimeChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AddEntryPanel.displayName = 'AddEntryPanel'
