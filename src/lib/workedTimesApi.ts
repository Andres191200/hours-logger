import type { AxiosInstance } from 'axios'
import type { Person, PersonObjective, WorkedTimeEntry, CreateWorkedTimePayload } from '@/types'

export const getPersons = (client: AxiosInstance): Promise<Person[]> =>
  client.get('/persons').then(r => r.data)

export const getPersonObjectives = (client: AxiosInstance, personId: number): Promise<PersonObjective[]> =>
  client.get(`/worked-times/person-objectives?personId=${personId}`).then(r => r.data)

export const getWorkedTimes = (client: AxiosInstance, date: string, personId: number): Promise<WorkedTimeEntry[]> =>
  client.get(`/worked-times?date=${date}&personId=${personId}`).then(r => r.data)

export const createWorkedTime = (client: AxiosInstance, payload: CreateWorkedTimePayload): Promise<WorkedTimeEntry> =>
  client.post('/worked-times', payload).then(r => r.data)

export const deleteWorkedTime = (client: AxiosInstance, id: number): Promise<void> =>
  client.delete(`/worked-times/${id}`).then(r => r.data)
