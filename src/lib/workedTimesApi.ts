import type { AxiosInstance } from 'axios'
import type { Person, PersonObjective, Project, WorkedTimeEntry, CreateWorkedTimePayload, ReportByPersonEntry } from '@/types'

export const getPersons = (client: AxiosInstance): Promise<Person[]> =>
  client.get('/persons').then(r => r.data)

export const getPersonObjectives = (client: AxiosInstance, personId: number): Promise<PersonObjective[]> =>
  client.get(`/worked-times/person-objectives?personId=${personId}`).then(r => r.data)

export const getProjects = (client: AxiosInstance): Promise<Project[]> =>
  client.get('/projects', { params: { state: 'activo,analisis' } }).then(r => r.data)

export const getWorkedTimes = (client: AxiosInstance, date: string, personId: number): Promise<WorkedTimeEntry[]> =>
  client.get(`/worked-times?date=${date}&personId=${personId}`).then(r => r.data)

export const createWorkedTime = (client: AxiosInstance, payload: CreateWorkedTimePayload): Promise<WorkedTimeEntry> =>
  client.post('/worked-times', payload).then(r => r.data)

export const deleteWorkedTime = (client: AxiosInstance, id: number): Promise<void> =>
  client.delete(`/worked-times/${id}`).then(r => r.data)

export const getWorkedTimesReport = (
  client: AxiosInstance,
  dateFrom: string,
  dateTo: string,
): Promise<ReportByPersonEntry[]> =>
  client.get(`/worked-times/report/by-person?dateFrom=${dateFrom}&dateTo=${dateTo}`).then(r => r.data)
