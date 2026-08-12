import axios from 'axios'

// AFTER
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Automatically unwrap ApiResponse<T>: { success, message, data } → data
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return { ...response, data: response.data.data }
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message?.toLowerCase() || ''

    // Only logout on 401 from our own API, or explicit token-related 400s
    const isOwnApi = error.config?.url?.startsWith('/api') || error.config?.baseURL?.includes('localhost')
    const authFailure = isOwnApi && (
      status === 401 ||
      (status === 400 && (
        message.includes('not found in database') ||
        message.includes('invalid or expired token') ||
        message.includes('token has expired') ||
        message.includes('logged in user not found')
      ))
    )

    if (authFailure) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
