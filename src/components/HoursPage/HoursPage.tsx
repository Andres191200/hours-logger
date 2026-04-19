'use client'
import { useState, useCallback, useMemo, startTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

import { DayStrip } from '@/components/DayStrip/DayStrip'
import { EntryCard } from '@/components/EntryCard/EntryCard'
import { AddEntryPanel } from '@/components/AddEntryPanel/AddEntryPanel'
import { PendingEntry } from '@/components/PendingEntry/PendingEntry'
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'

import { createClientApiInstance } from '@/lib/api'
import {
  getPersons,
  getPersonObjectives,
  getWorkedTimes,
  createWorkedTime,
  deleteWorkedTime,
} from '@/lib/workedTimesApi'
import { getVisibleDates, getDefaultDate, formatMinutes } from '@/lib/dates'

import type { PendingEntry as PendingEntryType, CreateWorkedTimePayload } from '@/types'
import styles from './HoursPage.module.scss'

export function HoursPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate)
  const [pendingEntries, setPendingEntries] = useState<PendingEntryType[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const dates = useMemo(() => getVisibleDates(), [])

  const accessToken = session?.accessToken ?? ''
  const zitadelId = session?.user?.zitadelId ?? ''

  const apiClient = useMemo(
    () => (accessToken ? createClientApiInstance(accessToken) : null),
    [accessToken]
  )

  // Fetch persons
  const { data: persons } = useQuery({
    queryKey: ['persons', accessToken],
    queryFn: () => getPersons(apiClient!),
    enabled: !!apiClient,
  })

  // Resolve personId from zitadelId
  const personId = useMemo(() => {
    if (!persons || !zitadelId) return null
    const person = persons.find((p) => p.userId === zitadelId)
    return person?.id ?? null
  }, [persons, zitadelId])

  // Fetch objectives — parallel with person fetch above (enabled when personId resolves)
  const { data: objectives = [] } = useQuery({
    queryKey: ['person-objectives', personId],
    queryFn: () => getPersonObjectives(apiClient!, personId!),
    enabled: !!apiClient && !!personId,
  })

  // Fetch worked times for selected date
  const { data: workedTimes = [], isLoading: loadingTimes } = useQuery({
    queryKey: ['worked-times', selectedDate, personId],
    queryFn: () => getWorkedTimes(apiClient!, selectedDate, personId!),
    enabled: !!apiClient && !!personId,
  })

  // Group entries by objectiveId (or projectId for project-only entries)
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

  // Delete mutation
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

  // Save all pending entries
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!personId || pendingEntries.length === 0 || !apiClient) return
    setIsSaving(true)

    const results = await Promise.allSettled(
      pendingEntries.map((entry) => {
        const payload: CreateWorkedTimePayload = {
          date: selectedDate,
          minutes: entry.minutes,
          projectId: entry.target.projectId,
          personId,
          ...(entry.target.kind === 'objective' ? { objectiveId: entry.target.objectiveId } : {}),
        }
        return createWorkedTime(apiClient, payload)
      })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected')

    if (succeeded > 0) {
      setPendingEntries((prev) => {
        const failedIdxs = new Set(
          results
            .map((r, i) => (r.status === 'rejected' ? i : -1))
            .filter((i) => i !== -1)
        )
        return prev.filter((_, i) => failedIdxs.has(i))
      })
      queryClient.invalidateQueries({ queryKey: ['worked-times'] })
      toast.success(`${succeeded} ${succeeded === 1 ? 'entry' : 'entries'} saved`)
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} ${failed.length === 1 ? 'entry' : 'entries'} failed to save`)
    }

    setIsSaving(false)
  }, [personId, pendingEntries, apiClient, selectedDate, queryClient])

  const handleAddPending = useCallback((entry: PendingEntryType) => {
    setPendingEntries((prev) => [...prev, entry])
  }, [])

  const handleRemovePending = useCallback((id: string) => {
    setPendingEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

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
  const isLoggedIn = !!session

  if (!isLoggedIn) {
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

      <main className={styles.main}>
        <section className={styles.dayStripSection} aria-label="Date selector">
          <DayStrip dates={dates} selectedDate={selectedDate} onSelect={handleDateSelect} />
        </section>

        <section className={styles.entriesSection} aria-label="Logged entries">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Logged</h2>
            {totalLoggedMinutes > 0 && (
              <span className={`${styles.totalBadge} ${totalLoggedMinutes < 360 ? styles.totalBadgeWarning : ''}`}>
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
              onAdd={handleAddPending}
            />
          ) : (
            <div className={styles.entriesLoading}>
              <div className={styles.skeletonInput} />
            </div>
          )}

          {pendingEntries.length > 0 && (
            <div className={styles.pendingSection}>
              <div className={styles.pendingHeader}>
                <span className={styles.pendingTitle}>
                  Queue ({pendingEntries.length})
                </span>
              </div>
              <div className={styles.pendingList}>
                <AnimatePresence initial={false}>
                  {pendingEntries.map((entry) => (
                    <PendingEntry
                      key={entry.id}
                      entry={entry}
                      onRemove={handleRemovePending}
                    />
                  ))}
                </AnimatePresence>
              </div>
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
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Save {pendingEntries.length} {pendingEntries.length === 1 ? 'entry' : 'entries'}
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
