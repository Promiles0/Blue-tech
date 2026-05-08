import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

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
    // Expired / invalid JWT → the backend throws RuntimeException → 400
    // Also handle explicit 401. Either way, clear stale credentials.
    const status = error.response?.status
    const message = error.response?.data?.message?.toLowerCase() || ''
    const authFailure = status === 401 || status === 403 ||
      (status === 400 && (
        message.includes('not found in database') ||
        message.includes('invalid or expired token') ||
        message.includes('token has expired') ||
        message.includes('logged in user not found') ||
        message.includes('unauthorized')
      ))

    if (authFailure) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Reload so React state resets cleanly
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
