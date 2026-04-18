import { useState } from 'react'
import api from '../lib/axios'

export default function CompanyResponseForm({ complaintId, onSubmitted }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post(`/complaints/${complaintId}/response`, { content })
      onSubmitted(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit response.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 border-l-4 border-green-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Respond to this complaint</h3>
          <p className="text-xs text-gray-500">Your response will be publicly visible</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write your official response. Be professional, empathetic, and address the specific issue raised…"
          className="input resize-none"
          required
          maxLength={5000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{content.length}/5000</span>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              </span>
            ) : 'Submit response'}
          </button>
        </div>
      </form>
    </div>
  )
}
