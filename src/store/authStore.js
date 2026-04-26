import { create } from 'zustand'
import api from '../lib/axios'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') ?? null,
  loading: false,

  register: async (data) => {
    set({ user: null, token: null, loading: true })
    localStorage.removeItem('token')
    try {
      const res = await api.post('/auth/register', data)
      localStorage.setItem('token', res.data.token)
      set({ user: res.data.user, token: res.data.token, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  login: async (data) => {
    set({ user: null, token: null, loading: true })
    localStorage.removeItem('token')
    try {
      const res = await api.post('/auth/login', data)
      localStorage.setItem('token', res.data.token)
      set({ user: res.data.user, token: res.data.token, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: async () => {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchUser: async () => {
    if (!localStorage.getItem('token')) return
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
