import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { api, apiErrorMessage } from '../lib/api'
import { useAuthStore } from '../store/authStore'

type Tab = 'email' | 'phone'

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier
  }
}

const firebaseEnabled = auth !== null
// Flag so we only exchange token once
let googleLoginInProgress = false

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const setAuth = useAuthStore((s) => s.setAuth)

  const [tab, setTab] = useState<Tab>('email')
  const [form, setForm] = useState({ usernameOrPhone: '', password: '' })
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const confirmRef = useRef<ConfirmationResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')

  async function exchangeToken(user: User) {
    if (googleLoginInProgress) return
    googleLoginInProgress = true
    try {
      const idToken = await user.getIdToken()
      const res = await api.post('/auth/firebase', { idToken })
      setAuth(res.data)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
      setLoading(false)
    } finally {
      googleLoginInProgress = false
    }
  }

  // Listen for Google redirect result on page load
  useEffect(() => {
    if (!auth) return

    // First try getRedirectResult (fires immediately after Google redirect)
    setLoading(true)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await exchangeToken(result.user)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        setError(apiErrorMessage(err))
        setLoading(false)
      })

    // Also watch auth state — fires when Firebase completes the redirect sign-in
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && !googleLoginInProgress) {
        // Check if this is from a Google redirect (not already logged in via email)
        const providerIds = user.providerData.map((p) => p.providerId)
        if (providerIds.includes('google.com')) {
          setLoading(true)
          await exchangeToken(user)
        }
      }
    })
    return () => unsub()
  }, []) // eslint-disable-line

  async function handleGoogle() {
    if (!auth) { setError('Google login requires Firebase credentials.'); return }
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithRedirect(auth, provider)
    } catch (err) {
      setError(apiErrorMessage(err))
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    if (!auth) { setError('Phone login requires Firebase credentials.'); return }
    setError('')
    setInfo('')
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`
    if (!normalized.match(/^\+[1-9]\d{7,14}$/)) {
      setError('Enter a valid phone number, e.g. +919876543210')
      return
    }
    setLoading(true)
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = undefined
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      const confirmation = await signInWithPhoneNumber(auth, normalized, window.recaptchaVerifier)
      confirmRef.current = confirmation
      setOtpSent(true)
      setInfo('OTP sent! Check your SMS.')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setError('')
    setLoading(true)
    try {
      if (!confirmRef.current) throw new Error('Please request OTP first.')
      const result = await confirmRef.current.confirm(otp)
      const idToken = await result.user.getIdToken()
      const res = await api.post('/auth/firebase', { idToken })
      setAuth(res.data)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      setAuth(res.data)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const tabCls = (t: Tab) =>
    `flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
      tab === t ? 'bg-coral text-white shadow' : 'text-ink/50 hover:text-ink'
    }`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-base">
      <div className="w-full max-w-md">
        <div className="bg-panel border border-hairline/10 rounded-2xl p-8 shadow-xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-ink/40 text-sm">Sign in to your Jyoti Sales account</p>
          </div>

          {/* Google button */}
          <button
            id="btn-google-login"
            onClick={handleGoogle}
            disabled={loading}
            title={!firebaseEnabled ? 'Configure Firebase credentials to enable Google login' : undefined}
            className={`w-full flex items-center justify-center gap-3 border border-hairline/20 rounded-full py-3 text-sm font-semibold transition-all mb-6 ${
              firebaseEnabled ? 'hover:bg-base/60' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6A23.7 23.7 0 0 0 24 .5C14.8.5 6.9 6 3 13.9l7 5.4C11.8 13.1 17.4 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.8C43.3 37.5 46.5 31.5 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10 28.7A14.3 14.3 0 0 1 9.5 24c0-1.7.3-3.3.8-4.8L3.2 13.9A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.3 2.6 10.4l6.9-5.7z"/>
              <path fill="#34A853" d="M24 47.5c6.4 0 11.8-2.1 15.7-5.7l-7.4-5.8c-2.1 1.4-4.8 2.3-8.3 2.3-6.5 0-12-4.4-14-10.3l-6.9 5.4C6.9 42 14.8 47.5 24 47.5z"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
            {!firebaseEnabled && <span className="text-[10px] text-ink/30 ml-1">(not configured)</span>}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-hairline/15" />
            <span className="text-xs text-ink/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-hairline/15" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-base rounded-xl p-1 mb-6">
            <button className={tabCls('email')} onClick={() => { setTab('email'); setError('') }}>
              Email / Password
            </button>
            <button className={tabCls('phone')} onClick={() => { setTab('phone'); setError(''); setOtpSent(false); setInfo('') }}>
              Phone OTP {!firebaseEnabled && <span className="text-[9px] opacity-40 ml-0.5">(needs Firebase)</span>}
            </button>
          </div>

          {/* Email tab */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input
                id="login-email"
                placeholder="Email or Phone"
                value={form.usernameOrPhone}
                onChange={(e) => setForm((f) => ({ ...f, usernameOrPhone: e.target.value }))}
                className="w-full bg-base border border-hairline/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-coral/50 transition-colors"
              />
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-base border border-hairline/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-coral/50 transition-colors"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                id="btn-email-login"
                disabled={loading}
                type="submit"
                className="w-full rounded-full bg-coral text-white font-semibold py-3 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
          )}

          {/* Phone OTP tab */}
          {tab === 'phone' && (
            <div className="space-y-4">
              {!firebaseEnabled && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-400">
                  ⚠️ Phone OTP requires Firebase credentials.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  id="login-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  disabled={otpSent || !firebaseEnabled}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-base border border-hairline/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-coral/50 transition-colors disabled:opacity-50"
                />
                <button
                  id="btn-send-otp"
                  onClick={otpSent ? () => { setOtpSent(false); setOtp(''); setInfo('') } : handleSendOtp}
                  disabled={loading || !firebaseEnabled}
                  className="px-4 py-3 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  {otpSent ? 'Resend' : loading ? '…' : 'Send OTP'}
                </button>
              </div>
              {otpSent && (
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-base border border-hairline/15 rounded-xl px-4 py-3 text-sm tracking-[0.4em] text-center focus:outline-none focus:border-coral/50 transition-colors"
                />
              )}
              {info && <p className="text-green-400 text-sm">{info}</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {otpSent && (
                <button
                  id="btn-verify-otp"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full rounded-full bg-coral text-white font-semibold py-3 disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              )}
              <div id="recaptcha-container" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-ink/40">
              New here?{' '}
              <Link to="/register" className="text-coral font-medium hover:underline">
                Create an account
              </Link>
            </p>
            <p className="text-xs text-ink/25">
              Demo: admin@jyotisales.in / Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
