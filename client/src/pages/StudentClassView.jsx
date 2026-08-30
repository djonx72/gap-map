import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import Button from '../components/common/Button.jsx'
import SkeletonBlock from '../components/common/SkeletonBlock.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

import supabase from '../lib/supabaseClient.js'
import { getClassById } from '../services/classApi.js'
import { getQuizQuestions, getSubmissionStatus } from '../services/submissionApi.js'

export default function StudentClassView() {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClassData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No active session.')

      const accessToken = session.access_token

      const [classRes, questionsRes, statusRes] = await Promise.all([
        getClassById({ accessToken, classId }),
        getQuizQuestions({ accessToken, classId }),
        getSubmissionStatus({ accessToken, classId })
      ])

      setClassData({
        name: classRes.name,
        subject: classRes.subject,
        teacherName: classRes.teacher_name,
        questionCount: questionsRes.length,
        isCompleted: statusRes.completed
      })
    } catch (err) {
      setError(err.message || 'Could not load class details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassData()
  }, [classId])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const name = profile?.full_name ?? ''
  const role = profile?.role ?? 'student'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      <DashboardNav userName={name} role={role} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-16">
        <Link 
          to="/student-dashboard" 
          className="inline-block mb-8 text-sm font-medium hover:underline"
          style={{ color: '#8A94A6' }}
        >
          &larr; Back to dashboard
        </Link>

        {loading ? (
          <div>
            <SkeletonBlock className="h-10 w-1/3 mb-2" />
            <SkeletonBlock className="h-5 w-1/4 mb-10" />
            <SkeletonBlock className="h-6 w-1/5 mb-6" />
            <SkeletonBlock className="h-12 w-32 rounded-md" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-3">
            <ErrorBanner>{error}</ErrorBanner>
            <Button onClick={fetchClassData} variant="secondary">
              Try again
            </Button>
          </div>
        ) : classData ? (
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-2" style={{ color: '#16293B' }}>
              {classData.name}
            </h1>
            <p className="text-lg mb-10" style={{ color: '#8A94A6' }}>
              {classData.subject} &middot; Taught by {classData.teacherName}
            </p>

            <div className="bg-white border p-8 rounded-xl shadow-sm" style={{ borderColor: '#E2DED8' }}>
              <div className="mb-6">
                <p className="text-lg font-medium" style={{ color: '#26313D' }}>
                  {classData.questionCount} questions
                </p>
              </div>

              {classData.isCompleted ? (
                <div className="flex flex-col items-start gap-4">
                  <div 
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: '#EDF2EC', color: '#7A9B76' }}
                  >
                    Quiz completed
                  </div>
                  <Button 
                    onClick={() => navigate(`/student/class/${classId}/results`)}
                    variant="secondary"
                  >
                    View your results
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => navigate(`/student/class/${classId}/quiz`)}
                  style={{ backgroundColor: '#E2963C', color: '#fff' }}
                >
                  Start quiz
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
