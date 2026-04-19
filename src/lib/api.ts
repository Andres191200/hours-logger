import axios from 'axios'
import { auth } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL + 'api'

export const apiClient = axios.create({ baseURL: BASE_URL })

apiClient.interceptors.request.use(async (config) => {
  const session = await auth()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

// Client-side axios instance — pass the token explicitly from useSession()
export const createClientApiInstance = (accessToken: string) => {
  const instance = axios.create({ baseURL: BASE_URL })
  instance.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  })
  return instance
}
