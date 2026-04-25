import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.jsx'
import useAuthStore from './store/authStore.js'
import './index.css'

if (localStorage.getItem('token')) {
  useAuthStore.getState().fetchUser()
}

// Re-fetch user when tab regains focus — catches email verification done in another tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
    useAuthStore.getState().fetchUser()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
