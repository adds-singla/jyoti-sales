import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken, setAuth, logout } = useAuthStore.getState()
      if (!refreshToken) {
        logout()
        return Promise.reject(error)
      }
      try {
        if (!refreshing) {
          refreshing = api
            .post('/auth/refresh', { refreshToken })
            .then((res) => {
              setAuth(res.data)
              return res.data.accessToken as string
            })
            .finally(() => {
              refreshing = null
            })
        }
        const newToken = await refreshing
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        }
      } catch {
        logout()
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(err: unknown): string {
  const anyErr = err as any
  return anyErr?.response?.data?.message || anyErr?.message || 'Something went wrong. Please try again.'
}
