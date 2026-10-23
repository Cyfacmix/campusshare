import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const store = {
  get access() { return localStorage.getItem('access') },
  get refresh() { return localStorage.getItem('refresh') },
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem('access', access)
  if (refresh) localStorage.setItem('refresh', refresh)
}

export function clearSession() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('user')
}

export const getRefreshToken = () => store.refresh
export const hasSession = () => Boolean(store.access)

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  if (store.access) config.headers.Authorization = `Bearer ${store.access}`
  return config
})

let refreshing = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')
    if (status === 401 && original && !original._retry && store.refresh && !isAuthCall) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_URL}/auth/refresh/`, { refresh: store.refresh })
            .finally(() => { refreshing = null })
        }
        const { data } = await refreshing
        setTokens(data.access, data.refresh)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        clearSession()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default api
