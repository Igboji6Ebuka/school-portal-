import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to your Render backend URL (e.g. https://your-backend.onrender.com).
// In development, the Vite proxy handles /api → localhost:5000.
const rawUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

let baseURL = '/api'
if (rawUrl) {
  // If user entered e.g. https://my-backend.onrender.com/api, don't duplicate /api
  baseURL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`
}

const api = axios.create({ baseURL })

// Helper to get backend root URL (e.g. for uploads/photos)
export const getBackendRoot = () => {
  if (rawUrl) {
    return rawUrl.replace(/\/api$/, '')
  }
  return ''
}

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
