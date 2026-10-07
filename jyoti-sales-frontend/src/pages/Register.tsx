import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      setAuth(res.data)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-ink/50 mb-8">Join Jyoti Sales for faster checkout and order tracking.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" />
        <input placeholder="Password (min 6 characters)" type="password" value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" required />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-sm text-ink/40 mt-6">
        Already have an account? <Link to="/login" className="text-coral">Log in</Link>
      </p>
    </div>
  )
}
