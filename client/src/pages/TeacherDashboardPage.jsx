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
import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function TeacherDashboardPage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const name   = profile?.full_name  ?? ''
  const school = profile?.school_name ?? ''
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
          </div>

          <EmptyState
            icon={<LayoutGrid size={22} style={{ color: '#8A94A6' }} aria-hidden="true" />}
            heading="Your classes will appear here"
            body="Once you create a class, your students can join with a code and you'll be able to see where they're getting stuck."
          />
        </section>

      </main>
    </div>
  )
}
