/**
 * TeacherDashboardPage — dashboard for teachers.
 *
 * Displays:
 *  - DashboardNav with teacher name, role badge, and logout
 *  - Welcome heading using the teacher's name and school
 *  - EmptyState panel for the upcoming classes list
 *
 * Real user data comes from AuthContext's profile (fetched from the profiles table).
 * ProtectedRoute ensures this page is only reachable by authenticated teachers.
 */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ClassCard from '../components/dashboard/ClassCard.jsx'
import Button from '../components/common/Button.jsx'
import SkeletonBlock from '../components/common/SkeletonBlock.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import supabase from '../lib/supabaseClient.js'
import { getTeacherClasses } from '../services/classApi.js'

export default function TeacherDashboardPage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchClasses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('No active session found.')
        }

        const data = await getTeacherClasses({ accessToken: session.access_token })
        if (isMounted) {
          setClasses(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchClasses()
    return () => { isMounted = false }
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const name   = profile?.full_name  ?? 'Teacher'
  const school = profile?.school_name ?? 'School'
  const role   = profile?.role        ?? 'teacher'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      <DashboardNav userName={name} role={role} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-16">

        {/* Welcome section */}
        <section className="mb-10" aria-label="Welcome">
          <h1
            className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-1"
            style={{ color: '#16293B' }}
          >
            Good to see you, {name.split(' ')[0]}.
          </h1>
          <p className="text-sm" style={{ color: '#8A94A6' }}>
            {school} · Teacher
          </p>
        </section>

        {/* Classes section */}
        <section aria-label="Your classes">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: '#26313D' }}
            >
              Your classes
            </h2>
            <Button onClick={() => navigate('/create-class')} className="py-2 px-4 text-xs">
              Create Class
            </Button>
          </div>

          {error ? (
            <ErrorBanner className="mb-6">
              {error}
            </ErrorBanner>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonBlock height="120px" radius="0.75rem" />
              <SkeletonBlock height="120px" radius="0.75rem" />
              <SkeletonBlock height="120px" radius="0.75rem" />
            </div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map(c => (
                <ClassCard key={c.id} {...c} code={c.class_code} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<LayoutGrid size={22} style={{ color: '#8A94A6' }} aria-hidden="true" />}
              heading="You haven't created a class yet"
              body={
                <span className="flex flex-col items-center gap-3">
                  Once you create a class, your students can join with a code and you'll be able to see where they're getting stuck.
                  <Link
                    to="/create-class"
                    className="font-medium transition-colors duration-150 mt-1"
                    style={{ color: '#E2963C' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#c97d2c' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#E2963C' }}
                  >
                    Create your first class
                  </Link>
                </span>
              }
            />
          )}
        </section>

      </main>
    </div>
  )
}
