'use client'
import { useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { BottomNav } from '@/components/BottomNav/BottomNav'

import { createClientApiInstance } from '@/lib/api'
import { getPersons, getWorkedTimesReport } from '@/lib/workedTimesApi'
import { formatMinutes } from '@/lib/dates'

import type { ReportByPersonEntry } from '@/types'
import styles from './MetricsPage.module.scss'

function getMonthRange(): { dateFrom: string; dateTo: string; label: string } {
  const now = new Date()
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const dateTo = now.toISOString().slice(0, 10)
  const label = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  return { dateFrom, dateTo, label }
}

function countWorkingDays(dateFrom: string, dateTo: string): number {
  const from = new Date(dateFrom + 'T00:00:00')
  const to = new Date(dateTo + 'T00:00:00')
  let count = 0
  const d = new Date(from)
  while (d <= to) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count || 1
}

function buildStats(report: ReportByPersonEntry, dateFrom: string, dateTo: string) {
  const workingDays = countWorkingDays(dateFrom, dateTo)
  const dailyAvgMinutes = Math.round(report.totalMinutes / workingDays)

  const allObjectives = report.projects.flatMap((p) =>
    p.objectives.map((o) => ({
      label: o.objectiveTitle,
      minutes: o.totalMinutes,
      hours: Math.round((o.totalMinutes / 60) * 10) / 10,
    }))
  )
  const topObjectives = [...allObjectives]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8)

  const topProject = [...report.projects].sort((a, b) => b.totalMinutes - a.totalMinutes)[0]

  return {
    totalMinutes: report.totalMinutes,
    dailyAvgMinutes,
    objectivesCount: allObjectives.length,
    topProjectName: topProject?.projectName ?? '—',
    topObjectives,
  }
}

export function MetricsPage() {
  const { data: session } = useSession()

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
    return persons.find((p) => p.userId === zitadelId)?.id ?? null
  }, [persons, zitadelId])

  const { dateFrom, dateTo, label } = useMemo(() => getMonthRange(), [])

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', dateFrom, dateTo, accessToken],
    queryFn: () => getWorkedTimesReport(apiClient!, dateFrom, dateTo),
    enabled: !!apiClient,
  })

  const myReport = useMemo(() => {
    if (!report || !personId) return null
    return report.find((r) => r.personId === personId) ?? null
  }, [report, personId])

  const stats = useMemo(
    () => (myReport ? buildStats(myReport, dateFrom, dateTo) : null),
    [myReport, dateFrom, dateTo]
  )

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
          <div className={styles.pageTitle}>
            <h1 className={styles.title}>Stats</h1>
            <span className={styles.titlePeriod}>{label}</span>
          </div>

          {/* Stat cards */}
          <section className={styles.statsGrid} aria-label="Monthly statistics">
            {isLoading || !stats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))
            ) : (
              <>
                <StatCard
                  label="Total this month"
                  value={formatMinutes(stats.totalMinutes)}
                  accent
                />
                <StatCard
                  label="Daily average"
                  value={formatMinutes(stats.dailyAvgMinutes)}
                  warn={stats.dailyAvgMinutes < 360}
                />
                <StatCard
                  label="Objectives worked"
                  value={String(stats.objectivesCount)}
                />
                <StatCard
                  label="Top project"
                  value={stats.topProjectName}
                  small
                />
              </>
            )}
          </section>

          {/* Bar chart */}
          <section className={styles.chartSection} aria-label="Top objectives">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Top objectives</h2>
            </div>

            {isLoading || !stats ? (
              <div className={styles.chartSkeleton} />
            ) : stats.topObjectives.length === 0 ? (
              <div className={styles.emptyState}>No objectives logged this month</div>
            ) : (
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={Math.max(220, stats.topObjectives.length * 44)}>
                  <BarChart
                    data={stats.topObjectives}
                    layout="vertical"
                    margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                    barSize={18}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-subtle)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      dataKey="hours"
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={180}
                      tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-border-subtle)' }}
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: 'var(--color-text-primary)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      }}
                      labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: 2 }}
                      formatter={(v: unknown) => [`${v}h`, 'Hours']}
                    />
                    <Bar
                      dataKey="hours"
                      fill="var(--color-accent)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
  warn,
  small,
}: {
  label: string
  value: string
  accent?: boolean
  warn?: boolean
  small?: boolean
}) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ''}`}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={`${styles.statValue} ${small ? styles.statValueSmall : ''} ${warn ? styles.statValueWarn : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
