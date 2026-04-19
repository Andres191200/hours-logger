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

// A pending entry staged for submission
export interface PendingEntry {
  id: string // local uuid
  target: SearchTarget
  activityType?: ActivityType // only for project-kind targets
  minutes: number
  label: string // display string e.g. "Redesign home · Grava App" or "Kubernetes · Meeting"
}
