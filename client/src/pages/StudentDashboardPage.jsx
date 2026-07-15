/**
 * StudentDashboardPage — dashboard for students.
 *
 * Displays:
 *  - DashboardNav with student name, role badge, and logout
 *  - Welcome heading using the student's name
 *  - EmptyState panel for the upcoming enrolled-classes list
 *
 * Real user data comes from AuthContext's profile (fetched from the profiles table).
 * ProtectedRoute ensures this page is only reachable by authenticated students.
 */
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const name = profile?.full_name ?? ''
  const role = profile?.role      ?? 'student'

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
            Hey, {name.split(' ')[0]}.
          </h1>
          <p className="text-sm" style={{ color: '#8A94A6' }}>
            Student
          </p>
        </section>

        {/* Enrolled classes section */}
        <section aria-label="Your enrolled classes">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-base font-semibold"
              style={{ color: '#26313D' }}
            >
              Your classes
            </h2>
          </div>

          <EmptyState
            icon={<BookOpen size={22} style={{ color: '#8A94A6' }} aria-hidden="true" />}
            heading="Your enrolled classes will appear here"
            body="Ask your teacher for a class code, then use it to join. Your questions and progress will show up here once you're in."
          />
        </section>

      </main>
    </div>
  )
}
