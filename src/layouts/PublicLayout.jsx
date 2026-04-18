import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Fair Go · Australia's public complaint platform
      </footer>
    </div>
  )
}
