import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '/functions/v1/api',
  headers: { 'Content-Type': 'application/json' },
  // A stalled connection should end in an error the page can show ("Try again"), not
  // skeletons that never go away. Generous enough for a cold start or a slow 3G link.
  timeout: 45000,
});

api.interceptors.request.use(async (config) => {
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
    if (status === 403 && error.response?.data?.code === 'MFA_SETUP_REQUIRED' && !window.location.pathname.startsWith('/admin/security')) {
      window.location.href = '/admin/security?required=1'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message?.toLowerCase() || ''

    // Only logout on 401 from our own API, or explicit token-related 400s
    const isOwnApi = error.config?.baseURL?.includes('/functions/v1') || error.config?.baseURL?.includes('functions.supabase.co')
    // Public endpoints (the AI chat) must never sign the shopper out on an error.
    const authFailure = isOwnApi && !error.config?.skipAuthRedirect && (
      status === 401 ||
      (status === 400 && (
        message.includes('not found in database') ||
        message.includes('invalid or expired token') ||
        message.includes('token has expired') ||
        message.includes('logged in user not found')
      ))
    )

    if (authFailure) {
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
