import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // withCredentials is intentionally omitted — the app uses Bearer token auth only.
  // Sending session cookies caused old company_admin sessions to bleed into new
  // consumer requests, because Sanctum's stateful guard takes the cookie over
  // the Bearer token when both are present.
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
      localStorage.removeItem('token')
      window.location.href = '/login?banned=1'
    }
    return Promise.reject(error)
  }
)

export default api
