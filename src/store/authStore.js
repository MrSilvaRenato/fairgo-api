import { create } from 'zustand'
import api from '../lib/axios'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') ?? null,
  loading: false,

  register: async (data) => {
    // Clear any existing session first so stale role/user never bleeds through
    set({ user: null, token: null, loading: true })
    localStorage.removeItem('token')
    const res = await api.post('/auth/register', data)
    localStorage.setItem('token', res.data.token)
    set({ user: res.data.user, token: res.data.token, loading: false })
  },

  login: async (data) => {
    // Clear any existing session first
    set({ user: null, token: null, loading: true })
    localStorage.removeItem('token')
    const res = await api.post('/auth/login', data)
    localStorage.setItem('token', res.data.token)
    set({ user: res.data.user, token: res.data.token, loading: false })
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))

export default useAuthStore
