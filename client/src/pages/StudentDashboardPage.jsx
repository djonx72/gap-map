import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RefreshCw } from 'lucide-react'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import Button from '../components/common/Button.jsx'
import SkeletonBlock from '../components/common/SkeletonBlock.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import SchoolClassCard from '../components/dashboard/SchoolClassCard.jsx'
import JoinClassModal from '../components/dashboard/JoinClassModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import supabase from '../lib/supabaseClient.js'
import { getSchoolClasses } from '../services/classApi.js'

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [preselectedClassName, setPreselectedClassName] = useState('')

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const fetchClasses = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No active session.')

      const classesData = await getSchoolClasses({ accessToken: session.access_token })
      
      // Map API response to UI model
      const mappedClasses = classesData.map(cls => ({
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        teacherName: cls.teacher_name,
        isEnrolled: cls.is_enrolled
      }))

      setClasses(mappedClasses)
    } catch (err) {
      setError(err.message || 'Could not load classes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleJoinSuccess = (joinedClassName) => {
    // In a real implementation, this would refetch or update the local state.
    // For now, we can just optionally trigger a refresh of the mock data.
    fetchClasses()
  }

  const handleClassClick = (cls) => {
    if (cls.isEnrolled) {
      navigate(`/class/${cls.id}`)
    } else {
      setPreselectedClassName(cls.name)
      setIsJoinModalOpen(true)
    }
  }

  const handleOpenJoinModal = () => {
    setPreselectedClassName('')
    setIsJoinModalOpen(true)
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

        {/* Classes in your school section */}
        <section className="mb-12" aria-label="Classes in your school">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2
              className="text-xl font-semibold"
              style={{ color: '#26313D' }}
            >
              Classes in your school
            </h2>
            <Button onClick={handleOpenJoinModal}>
              Join a class
            </Button>
          </div>

          {error ? (
            <div className="flex flex-col items-start gap-3">
              <ErrorBanner>{error}</ErrorBanner>
              <button 
                onClick={fetchClasses} 
                className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: '#E2963C' }}
              >
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-gray-100 flex flex-col h-[150px] justify-between">
                  <div>
                    <SkeletonBlock className="h-6 w-3/4 mb-2" />
                    <SkeletonBlock className="h-4 w-1/2 mb-4" />
                  </div>
                  <SkeletonBlock className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} style={{ color: '#8A94A6' }} aria-hidden="true" />}
              heading="No classes have been created in your school yet"
              body="When teachers in your school create classes, they will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {classes.map((cls) => (
                <SchoolClassCard
                  key={cls.id}
                  name={cls.name}
                  subject={cls.subject}
                  teacherName={cls.teacherName}
                  isEnrolled={cls.isEnrolled}
                  onClick={() => handleClassClick(cls)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      <JoinClassModal 
        isOpen={isJoinModalOpen} 
        onClose={() => {
          setIsJoinModalOpen(false)
          setPreselectedClassName('')
        }} 
        onJoinSuccess={handleJoinSuccess}
        preselectedClass={preselectedClassName}
      />
    </div>
  )
}
