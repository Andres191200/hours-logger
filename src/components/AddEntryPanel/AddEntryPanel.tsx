'use client'
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TargetSearch } from '@/components/TargetSearch/TargetSearch'
import { ActivityPicker } from '@/components/ActivityPicker/ActivityPicker'
import type { PersonObjective, Project, SearchTarget, ActivityType } from '@/types'
import styles from './AddEntryPanel.module.scss'

interface AddEntryPanelProps {
  personId: number
  objectives: PersonObjective[]
  projects: Project[]
  onAdd: (target: SearchTarget, activityType?: ActivityType) => void
}

type Step =
  | { name: 'search' }
  | { name: 'project-activity'; target: Extract<SearchTarget, { kind: 'project' }> }

const SUGGESTIONS_COUNT = 3

export function AddEntryPanel({ objectives, projects, onAdd }: AddEntryPanelProps) {
  const [step, setStep] = useState<Step>({ name: 'search' })

  const recentObjectives = useMemo(
    () => [...objectives].sort((a, b) => b.id - a.id).slice(0, SUGGESTIONS_COUNT),
    [objectives]
  )

  const handleTargetSelect = useCallback(
    (target: SearchTarget) => {
      if (target.kind === 'objective') {
        onAdd(target)
        setStep({ name: 'search' })
      } else {
        setStep({ name: 'project-activity', target })
      }
    },
    [onAdd]
  )

  const handleActivitySelect = useCallback(
    (activityType: ActivityType) => {
      if (step.name === 'project-activity') {
        onAdd(step.target, activityType)
        setStep({ name: 'search' })
      }
    },
    [step, onAdd]
  )

  const handleReset = useCallback(() => {
    setStep({ name: 'search' })
  }, [])

  return (
    <div className={styles.panel}>
      <AnimatePresence>
        {step.name === 'search' && recentObjectives.length > 0 && (
          <motion.div
            className={styles.suggestions}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {recentObjectives.map((obj) => (
              <button
                key={obj.id}
                className={styles.chip}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onAdd({ kind: 'objective', objectiveId: obj.id, title: obj.title, projectId: obj.projectId, projectName: obj.projectName })
                }}
              >
                <span className={styles.chipTitle}>{obj.title}</span>
                <span className={styles.chipSub}>{obj.projectName}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <TargetSearch
        objectives={objectives}
        projects={projects}
        onSelect={handleTargetSelect}
        disabled={step.name === 'project-activity'}
      />
      <div className="separator" />
      <AnimatePresence mode="wait">
        {step.name === 'project-activity' && (
          <motion.div
            key="activity-picker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={styles.activityWrap}
          >
            <div className={styles.projectBadge}>
              <span className={styles.badgeIcon}>📁</span>
              <span className={styles.badgeLabel}>{step.target.projectName}</span>
              <button className={styles.badgeReset} onClick={handleReset} aria-label="Clear selection">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ActivityPicker
              projectName={step.target.projectName}
              onSelect={handleActivitySelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
