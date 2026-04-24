export interface Person {
  id: number
  userId: string // matches zitadelId
  firstName: string
  lastName: string
}

export interface PersonObjective {
  id: number
  title: string
  projectId: number
  projectName: string
}

export interface Project {
  id: number
  code: string
  name: string
}

export interface WorkedTimeEntry {
  id: number
  date: string
  minutes: number
  projectId: number
  project?: { id: number; name: string; code: string }
  objectiveId?: number | null
  objective?: { id: number; title: string } | null
  personId: number
  createdAt: string
}

export interface CreateWorkedTimePayload {
  date: string
  minutes: number
  projectId: number
  objectiveId?: number
  personId?: number
}

// For the search — unified type for both objectives and projects
export type SearchTarget =
  | { kind: 'objective'; objectiveId: number; title: string; projectId: number; projectName: string }
  | { kind: 'project'; projectId: number; projectName: string }

// Activity types for project-level entries
export type ActivityType = 'meeting' | 'technical-discussion' | 'code-review'

export interface ActivityOption {
  type: ActivityType
  label: string
  icon: string
}

// ─── Report types ─────────────────────────────────────────────────────────────

export interface ReportObjective {
  objectiveId: number
  objectiveTitle: string
  totalMinutes: number
}

export interface ReportProject {
  projectId: number
  projectName: string
  projectCode: string
  totalMinutes: number
  objectives: ReportObjective[]
}

export interface ReportByPersonEntry {
  personId: number
  personFirstName: string
  personLastName: string
  totalMinutes: number
  projects: ReportProject[]
}

// An active entry being configured by the user (pre-POST)
export interface ActiveEntry {
  id: string
  target: SearchTarget
  activityType?: ActivityType
  hours: number   // 1–6
  minutes: number // 0, 15, 30, 45
  label: string
}
