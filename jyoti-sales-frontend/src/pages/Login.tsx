import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ usernameOrPhone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
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
      <h1 className="font-display text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-ink/50 mb-8">Log in to your Jyoti Sales account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Email or Phone" value={form.usernameOrPhone}
          onChange={(e) => setForm((f) => ({ ...f, usernameOrPhone: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" />
        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full bg-panel border border-hairline/15 rounded-lg px-4 py-3 text-sm" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 disabled:opacity-50">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p className="text-sm text-ink/40 mt-6">
        New here? <Link to="/register" className="text-coral">Create an account</Link>
      </p>
      <p className="text-xs text-ink/30 mt-8">
        Demo admin: admin@jyotisales.in / Admin@123 · Demo customer: customer@example.com / Customer@123
      </p>
    </div>
  )
}
