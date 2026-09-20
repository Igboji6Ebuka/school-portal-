import axios from 'axios'

// In production (Vercel), VITE_API_URL is set to your Render backend URL.
// In development, the Vite proxy handles /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : '/api'

const api = axios.create({ baseURL })

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
