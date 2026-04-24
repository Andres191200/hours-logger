'use client'
import { useState, useCallback, useMemo, startTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

import { DayStrip } from '@/components/DayStrip/DayStrip'
import { EntryCard } from '@/components/EntryCard/EntryCard'
import { AddEntryPanel } from '@/components/AddEntryPanel/AddEntryPanel'
import { ActiveEntryRow } from '@/components/ActiveEntryRow/ActiveEntryRow'
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { BottomNav } from '@/components/BottomNav/BottomNav'

import { createClientApiInstance } from '@/lib/api'
import {
  getPersons,
  getPersonObjectives,
  getProjects,
  getWorkedTimes,
  createWorkedTime,
  deleteWorkedTime,
} from '@/lib/workedTimesApi'
import { getVisibleDates, getDefaultDate, formatMinutes } from '@/lib/dates'

import type { ActiveEntry, SearchTarget, ActivityType, CreateWorkedTimePayload } from '@/types'
import styles from './HoursPage.module.scss'

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  'meeting': 'Meeting',
  'technical-discussion': 'Tech discussion',
  'code-review': 'Code review',
}

function makeLabel(target: SearchTarget, activityType?: ActivityType): string {
  if (target.kind === 'objective') return target.title
  return activityType
    ? `${target.projectName} · ${ACTIVITY_LABELS[activityType]}`
    : target.projectName
}

function isDuplicate(
  entries: ActiveEntry[],
  target: SearchTarget,
  activityType?: ActivityType
): boolean {
  return entries.some((e) => {
    if (e.target.kind !== target.kind) return false
    if (target.kind === 'objective' && e.target.kind === 'objective') {
      return e.target.objectiveId === target.objectiveId
    }
    if (target.kind === 'project' && e.target.kind === 'project') {
      return e.target.projectId === target.projectId && e.activityType === activityType
    }
    return false
  })
}

export function HoursPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate)
  const [activeEntries, setActiveEntries] = useState<ActiveEntry[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const dates = useMemo(() => getVisibleDates(), [])

  const accessToken = session?.accessToken ?? ''
  const zitadelId = session?.user?.zitadelId ?? ''

  const apiClient = useMemo(
    () => (accessToken ? createClientApiInstance(accessToken) : null),
    [accessToken]
  )

  const { data: persons } = useQuery({
    queryKey: ['persons', accessToken],
    queryFn: () => getPersons(apiClient!),
    enabled: !!apiClient,
  })

  const personId = useMemo(() => {
    if (!persons || !zitadelId) return null
    const person = persons.find((p) => p.userId === zitadelId)
    return person?.id ?? null
  }, [persons, zitadelId])

  const { data: objectives = [] } = useQuery({
    queryKey: ['person-objectives', personId],
    queryFn: () => getPersonObjectives(apiClient!, personId!),
    enabled: !!apiClient && !!personId,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', accessToken],
    queryFn: () => getProjects(apiClient!),
    enabled: !!apiClient,
  })

  const { data: workedTimes = [], isLoading: loadingTimes } = useQuery({
    queryKey: ['worked-times', selectedDate, personId],
    queryFn: () => getWorkedTimes(apiClient!, selectedDate, personId!),
    enabled: !!apiClient && !!personId,
  })

  const groupedEntries = useMemo(() => {
    const map = new Map<string, {
      ids: number[]
      title: string
      subtitle: string | null
      totalMinutes: number
    }>()

    for (const entry of workedTimes) {
      const key = entry.objectiveId != null
        ? `obj-${entry.objectiveId}`
        : `proj-${entry.projectId}`
      const title = entry.objective?.title ?? entry.project?.name ?? 'Unknown'
      const subtitle = entry.objective ? (entry.project?.name ?? null) : null

      const existing = map.get(key)
      if (existing) {
        existing.ids.push(entry.id)
        existing.totalMinutes += entry.minutes
      } else {
        map.set(key, { ids: [entry.id], title, subtitle, totalMinutes: entry.minutes })
      }
    }

    return Array.from(map.values())
  }, [workedTimes])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWorkedTime(apiClient!, id),
    onMutate: (id) => {
      setDeletingIds((prev) => new Set(prev).add(id))
    },
    onSuccess: (_, id) => {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['worked-times'] })
    },
    onError: (_, id) => {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error('Failed to delete entry')
    },
  })

  const handleTargetSelected = useCallback(
    (target: SearchTarget, activityType?: ActivityType) => {
      if (isDuplicate(activeEntries, target, activityType)) return
      const entry: ActiveEntry = {
        id: `${Date.now()}-${Math.random()}`,
        target,
        activityType,
        hours: 1,
        minutes: 0,
        label: makeLabel(target, activityType),
      }
      setActiveEntries((prev) => [...prev, entry])
    },
    [activeEntries]
  )

  const handleEntryChange = useCallback((id: string, hours: number, minutes: number) => {
    setActiveEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, hours, minutes } : e))
    )
  }, [])

  const handleEntryRemove = useCallback((id: string) => {
    setActiveEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleSave = useCallback(async () => {
    if (!personId || !apiClient || activeEntries.length === 0) return
    setIsSaving(true)

    const results = await Promise.allSettled(
      activeEntries.map((entry) => {
        const payload: CreateWorkedTimePayload = {
          date: selectedDate,
          minutes: entry.hours * 60 + entry.minutes,
          projectId: entry.target.projectId,
          personId,
          ...(entry.target.kind === 'objective' ? { objectiveId: entry.target.objectiveId } : {}),
        }
        return createWorkedTime(apiClient, payload)
      })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failedEntries = activeEntries.filter((_, i) => results[i].status === 'rejected')

    if (succeeded > 0) {
      setActiveEntries(failedEntries)
      queryClient.invalidateQueries({ queryKey: ['worked-times'] })
      toast.success(`${succeeded} ${succeeded === 1 ? 'entry' : 'entries'} saved`)
    }

    if (failedEntries.length > 0) {
      toast.error(`${failedEntries.length} ${failedEntries.length === 1 ? 'entry' : 'entries'} failed to save`)
    }

    setIsSaving(false)
  }, [personId, activeEntries, apiClient, selectedDate, queryClient])

  const handleDateSelect = useCallback((date: string) => {
    startTransition(() => {
      setSelectedDate(date)
    })
  }, [])

  const handleDelete = useCallback(
    (ids: number[]) => {
      ids.forEach((id) => deleteMutation.mutate(id))
      toast.success(ids.length === 1 ? 'Entry deleted' : `${ids.length} entries deleted`)
    },
    [deleteMutation]
  )

  const totalLoggedMinutes = workedTimes.reduce((sum, e) => sum + e.minutes, 0)
  const totalActiveMinutes = activeEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0)

  if (!session) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="var(--color-accent)" fillOpacity="0.15" />
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
          {session.user?.name && (
            <span className={styles.userName}>{session.user.name}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          <ThemeToggle />
          <button
            className={styles.signOutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.pageBody}>
        <main className={styles.main}>
          <section className={styles.dayStripSection} aria-label="Date selector">
            <DayStrip dates={dates} selectedDate={selectedDate} onSelect={handleDateSelect} />
          </section>

          <section className={styles.entriesSection} aria-label="Logged entries">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Logged</h2>
              {totalLoggedMinutes > 0 && (
                <span
                  className={`${styles.totalBadge} ${totalLoggedMinutes < 360 ? styles.totalBadgeWarning : ''}`}
                >
                  {formatMinutes(totalLoggedMinutes)} total
                </span>
              )}
            </div>

            {loadingTimes ? (
              <div className={styles.entriesLoading}>
                {[1, 2].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : groupedEntries.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="var(--color-text-muted)" strokeWidth="1.5" />
                  <path d="M12 8v4l3 3" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>No entries for this day</span>
              </div>
            ) : (
              <div className={styles.entriesList}>
                <AnimatePresence initial={false}>
                  {groupedEntries.map((group) => (
                    <EntryCard
                      key={group.ids[0]}
                      ids={group.ids}
                      title={group.title}
                      subtitle={group.subtitle}
                      totalMinutes={group.totalMinutes}
                      onDelete={handleDelete}
                      isDeleting={group.ids.some((id) => deletingIds.has(id))}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          <section className={styles.addSection} aria-label="Add entries">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Add entry</h2>
            </div>

            {personId ? (
              <AddEntryPanel
                personId={personId}
                objectives={objectives}
                projects={projects}
                onAdd={handleTargetSelected}
              />
            ) : (
              <div className={styles.entriesLoading}>
                <div className={styles.skeletonInput} />
              </div>
            )}

            <div className={styles.activeList}>
              <AnimatePresence initial={false}>
                {[...activeEntries].reverse().map((entry) => (
                  <ActiveEntryRow
                    key={entry.id}
                    entry={entry}
                    onChange={handleEntryChange}
                    onRemove={handleEntryRemove}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        </main>

        <AnimatePresence>
          {activeEntries.length > 0 && (
            <motion.aside
              className={styles.summaryPanel}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <p className={styles.summaryTitle}>Summary</p>
              <ul className={styles.summaryList}>
                {activeEntries.map((entry) => (
                  <li key={entry.id} className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>{entry.label}</span>
                    <span className={styles.summaryDuration}>
                      {formatMinutes(entry.hours * 60 + entry.minutes)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.summaryDivider} />
              <button
                className={`${styles.saveBtn} ${!isSaving ? styles.saveBtnActive : ''}`}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className={styles.saveBtnSpinner} />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Log {formatMinutes(totalActiveMinutes)}
                  </>
                )}
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
