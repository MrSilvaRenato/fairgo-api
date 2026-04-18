import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.jsx'
import useAuthStore from './store/authStore.js'
import './index.css'

if (localStorage.getItem('token')) {
  useAuthStore.getState().fetchUser()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
