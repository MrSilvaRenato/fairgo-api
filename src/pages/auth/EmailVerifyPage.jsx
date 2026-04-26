import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    const id        = searchParams.get('id')
    const hash      = searchParams.get('hash')
    const expires   = searchParams.get('expires')
    const signature = searchParams.get('signature')

    if (!id || !hash || !expires || !signature) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    api.get(`/auth/email/verify?id=${id}&hash=${hash}&expires=${expires}&signature=${signature}`)
      .then(() => { fetchUser(); setStatus('success') })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message ?? 'Verification failed. The link may have expired.')
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">

        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-eucalyptus border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-600 mb-6">Your account is now active. You can file complaints and use all features.</p>
            <Link
              to="/dashboard"
              className="inline-block bg-eucalyptus text-white font-semibold px-6 py-3 rounded-xl hover:bg-eucalyptus/90 transition"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/dashboard"
              className="inline-block bg-eucalyptus text-white font-semibold px-6 py-3 rounded-xl hover:bg-eucalyptus/90 transition"
            >
              Go to dashboard to resend
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
