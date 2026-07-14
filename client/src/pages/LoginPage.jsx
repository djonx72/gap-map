/**
 * LoginPage — split-screen auth layout.
 *
 * Left (55%): email + password form with "Log in" CTA.
 * Right (45%): SignaturePanel (shared with Signup).
 * Mobile: Signature collapses to a slim top band; form is the focus.
 *
 * Form submission: placeholder only — no real auth.
 * On "success", navigates to the relevant dashboard based on a hardcoded role.
 * TODO: Replace the handleSubmit body with a real API call and route based on returned user role.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import SignaturePanel from '../components/auth/SignaturePanel.jsx'
import FormField from '../components/auth/FormField.jsx'
import AuthButton from '../components/auth/AuthButton.jsx'
import GapMapLogo from '../components/common/GapMapLogo.jsx'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Basic client-side validation
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    // TODO: Replace this block with a real authentication API call.
    // On success, redirect to '/teacher-dashboard' or '/student-dashboard'
    // based on the role returned by the server.
    await new Promise(r => setTimeout(r, 1400))

    // Placeholder: route to teacher dashboard for any login attempt.
    // The real implementation will inspect the user's role from the auth response.
    setLoading(false)
    navigate('/teacher-dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>

      {/* ── Mobile top band (signature panel, collapsed) ────────────────────── */}
      <div
        className="md:hidden flex items-center justify-center py-6 px-6"
        style={{ backgroundColor: '#16293B', minHeight: '80px' }}
      >
        <GapMapLogo size="lg" inverted />
      </div>

      {/* ── Main split layout ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row">

        {/* ── Form panel (left / primary) ──────────────────────────────────── */}
        <main
          className="flex flex-1 flex-col justify-center px-8 py-14 md:px-16 lg:px-24"
          style={{ maxWidth: '100%' }}
          aria-label="Log in to GapMap"
        >
          <div className="w-full max-w-sm mx-auto">
            {/* Logo — hidden on mobile (shown in top band instead) */}
            <div className="hidden md:block mb-10">
              <GapMapLogo size="md" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1
                className="font-display text-4xl font-semibold leading-tight mb-2"
                style={{ color: '#16293B' }}
              >
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: '#8A94A6' }}>
                Log in to your GapMap account.
              </p>
            </div>

            {/* Form-level error */}
            {error && (
              <div
                role="alert"
                className="mb-5 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#FDF0EF', color: '#c0392b', border: '1px solid #f5c6c3' }}
              >
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <FormField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <FormField
                id="login-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              >
                {/* Show/hide password — icon used to remove ambiguity */}
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="cursor-pointer"
                  style={{ color: '#8A94A6' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#26313D' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
                >
                  {showPw
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye size={16} aria-hidden="true" />
                  }
                </button>
              </FormField>

              <div className="pt-1">
                <AuthButton loading={loading}>
                  {loading ? 'Logging in…' : 'Log in'}
                </AuthButton>
              </div>
            </form>

            {/* Switch to Signup */}
            <p className="mt-6 text-sm text-center" style={{ color: '#8A94A6' }}>
              New to GapMap?{' '}
              <Link
                to="/signup"
                className="font-medium transition-colors duration-150"
                style={{ color: '#E2963C' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#c97d2c' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#E2963C' }}
              >
                Create an account
              </Link>
            </p>
          </div>
        </main>

        {/* ── Signature panel (right) — hidden on mobile ───────────────────── */}
        <aside
          className="hidden md:flex md:w-5/12 lg:w-[45%]"
          aria-hidden="true"
          style={{ backgroundColor: '#16293B', minHeight: '100%' }}
        >
          <SignaturePanel />
        </aside>
      </div>
    </div>
  )
}
