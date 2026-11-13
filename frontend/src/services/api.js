import axios from 'axios'

export const AUTH_STORAGE_KEY = 'ckkPosAuth'

export function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.token) return null
    return parsed
  } catch {
    return null
  }
}

export function writeAuth(value) {
  if (value) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value))
  else localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getToken() {
  return readAuth()?.token || null
}

const rawBase = String(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')
const baseURL = /\/api\/v1$/.test(rawBase) ? rawBase : `${rawBase}/api/v1`

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let redirecting = false
const LOGIN_PATH = '/login'
/** Older rows stored order numbers with a leading '#'; normalize so UI prepends exactly one. */
function normalizeOrderNumbers(data) {
  if (Array.isArray(data)) data.forEach(normalizeOrderNumbers)
  else if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'orderNumber' && typeof value === 'string') data[key] = value.replace(/^#/, '')
      else normalizeOrderNumbers(value)
    }
  }
  return data
}

api.interceptors.response.use(
  (response) => {
    normalizeOrderNumbers(response.data)
    return response
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401 && !redirecting) {
      const url = error?.config?.url || ''
      // The login attempt itself may 401; do not loop on that.
      if (!url.includes('/auth/login')) {
        redirecting = true
        writeAuth(null)
        if (window.location.pathname !== LOGIN_PATH) {
          window.location.assign(LOGIN_PATH)
        }
        // Reset after navigation settles.
        setTimeout(() => {
          redirecting = false
        }, 1500)
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export default api
