/**
 * SignupPage — split-screen auth layout.
 *
 * Left (55%): full name, email, password, role toggle (Teacher / Student),
 *             conditional field (school name for teacher, class code for student),
 *             "Create account" CTA.
 * Right (45%): SignaturePanel (shared with Login).
 * Mobile: Signature collapses to slim top band.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import SignaturePanel from '../components/auth/SignaturePanel.jsx'
import RoleToggle from '../components/auth/RoleToggle.jsx'
import FormField from '../components/auth/FormField.jsx'
import AuthButton from '../components/auth/AuthButton.jsx'
import GapMapLogo from '../components/common/GapMapLogo.jsx'
import supabase from '../lib/supabaseClient.js'
import { createProfile } from '../services/authApi.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignupPage() {
  const navigate = useNavigate()
  const { reloadProfile } = useAuth()

  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [role, setRole]             = useState('teacher')
  const [schoolName, setSchoolName] = useState('')
  const [classCode, setClassCode]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [errors, setErrors]         = useState({})
  const [formError, setFormError]   = useState('')

  function validate() {
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Please enter your full name.'
    if (!email.trim()) errs.email = 'Please enter your email address.'
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (role === 'teacher' && !schoolName.trim()) errs.schoolName = 'Please enter your school name.'
    if (role === 'student' && !classCode.trim()) errs.classCode = 'Please enter the class code your teacher gave you.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setFormError('')
    setLoading(true)

    // Step 1: Create the Supabase auth account.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setFormError(signUpError.message)
      setLoading(false)
      return
    }

    // Step 2: Extract credentials from the just-completed signUp session.
    // If the Supabase project requires email confirmation, session will be null here —
    // the user must confirm their email before a token can be issued.
    const accessToken = signUpData.session?.access_token
    const userId = signUpData.user?.id

    if (!accessToken || !userId) {
      // Email confirmation is ON in Supabase — no session is returned until the user
      // clicks the confirmation link. Surface a clear message instead of a silent 401.
      setFormError(
        'Please check your inbox and confirm your email address. ' +
        'Once confirmed, log in to complete your account setup.'
      )
      setLoading(false)
      return
    }

    // Step 3: Create the profile row via the backend.
    try {
      await createProfile({
        accessToken,
        id: userId,
        full_name: fullName,
        role,
        school_name: role === 'teacher' ? schoolName : undefined,
        class_code: role === 'student' ? classCode : undefined,
      })
    } catch (profileError) {
      setFormError(profileError.message)
      setLoading(false)
      return
    }

    // Step 4: All done — show success state, reload profile, then navigate.
    // We MUST reload the profile here because onAuthStateChange fired instantly
    // after signUp() before this backend call finished, meaning AuthContext 
    // currently thinks this user has no profile row.
    await reloadProfile()
    
    setLoading(false)
    setSuccess(true)
    await new Promise(r => setTimeout(r, 900))
    navigate(role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>

      {/* ── Mobile top band ──────────────────────────────────────────────────── */}
      <div
        className="md:hidden flex items-center justify-center py-6 px-6"
        style={{ backgroundColor: '#16293B', minHeight: '80px' }}
      >
        <GapMapLogo size="lg" inverted />
      </div>

      {/* ── Main split layout ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row">

        {/* ── Form panel ───────────────────────────────────────────────────── */}
        <main
          className="flex flex-1 flex-col justify-center px-8 py-12 md:px-16 lg:px-24"
          aria-label="Create a GapMap account"
        >
          <div className="w-full max-w-sm mx-auto">
            {/* Logo — desktop only */}
            <div className="hidden md:block mb-10">
              <GapMapLogo size="md" />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1
                className="font-display text-4xl font-semibold leading-tight mb-2"
                style={{ color: '#16293B' }}
              >
                Start closing the gaps
              </h1>
              <p className="text-sm" style={{ color: '#8A94A6' }}>
                Create your GapMap account as a teacher or a student.
              </p>
            </div>

            {/* Form-level error (Supabase or backend) */}
            {formError && (
              <div
                role="alert"
                className="mb-5 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#FDF0EF', color: '#c0392b', border: '1px solid #f5c6c3' }}
              >
                {formError}
              </div>
            )}

            {/* Success state */}
            {success && (
              <div
                role="status"
                className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#EAF3EA', color: '#3A6E37', border: '1px solid #b8d9b6' }}
              >
                Account created — taking you to your dashboard…
              </div>
            )}

            {/* Signup form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <FormField
                id="signup-name"
                label="Full name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
                error={errors.fullName}
              />

              <FormField
                id="signup-email"
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                error={errors.email}
              />

              <FormField
                id="signup-password"
                label="Password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                error={errors.password}
              >
                <button
                  type="button"
                  id="btn-signup-toggle-password"
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

              {/* Role toggle */}
              <RoleToggle value={role} onChange={setRole} />

              {/* Conditional: school name (teacher) */}
              {role === 'teacher' && (
                <div className="animate-fade-in">
                  <FormField
                    id="signup-school"
                    label="School name"
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="e.g. Westfield Academy"
                    autoComplete="organization"
                    required
                    error={errors.schoolName}
                  />
                </div>
              )}

              {/* Conditional: class code (student) */}
              {role === 'student' && (
                <div>
                  <FormField
                    id="signup-classcode"
                    label="Class code"
                    type="text"
                    value={classCode}
                    onChange={e => setClassCode(e.target.value)}
                    placeholder="e.g. BIO-3A"
                    autoComplete="off"
                    required
                    helperText="Ask your teacher for this code."
                    error={errors.classCode}
                  />
                </div>
              )}

              <div className="pt-1">
                <AuthButton loading={loading}>
                  {loading ? 'Creating your account…' : 'Create account'}
                </AuthButton>
              </div>
            </form>

            {/* Switch to Login */}
            <p className="mt-6 text-sm text-center" style={{ color: '#8A94A6' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium transition-colors duration-150"
                style={{ color: '#E2963C' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#c97d2c' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#E2963C' }}
              >
                Log in
              </Link>
            </p>
          </div>
        </main>

        {/* ── Signature panel — desktop only ───────────────────────────────── */}
        <aside
          className="hidden md:flex md:w-5/12 lg:w-[45%]"
          aria-hidden="true"
          style={{ backgroundColor: '#16293B' }}
        >
          <SignaturePanel />
        </aside>
      </div>
    </div>
  )
}
