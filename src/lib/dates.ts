export const formatDateStr = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Returns last 8 weekdays (Mon–Fri), newest first
export const getVisibleDates = (): string[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekdays: string[] = []
  let daysBack = 0
  while (weekdays.length < 8) {
    const d = new Date(today)
    d.setDate(d.getDate() - daysBack)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) weekdays.push(formatDateStr(d))
    daysBack++
  }
  return weekdays
}

export const getDefaultDate = (): string => getVisibleDates()[0]

export const formatDayLabel = (dateStr: string): { day: string; date: string; isToday: boolean } => {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = d.getTime() === today.getTime()
  return {
    day: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday,
  }
}

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
