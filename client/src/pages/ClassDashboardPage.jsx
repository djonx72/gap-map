/**
 * ClassDashboardPage — dashboard for a specific class.
 * Shows the class code prominently and a list of questions (the question bank).
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import ClassCodeDisplay from '../components/dashboard/ClassCodeDisplay.jsx'
import QuestionCard from '../components/dashboard/QuestionCard.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import Button from '../components/common/Button.jsx'
import SkeletonBlock from '../components/common/SkeletonBlock.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import supabase from '../lib/supabaseClient.js'
import { getClassById } from '../services/classApi.js'
import { getClassQuestions } from '../services/questionApi.js'

export default function ClassDashboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [classData, setClassData] = useState(null)
  const [classLoading, setClassLoading] = useState(true)
  const [classError, setClassError] = useState(false)

  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [questionsError, setQuestionsError] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Simulate fetching class details
    const fetchClassDetails = async () => {
      setClassLoading(true)
      setClassError(false)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No active session.')

        const data = await getClassById({ accessToken: session.access_token, classId: id })
        if (isMounted) {
          setClassData(data)
        }
      } catch (err) {
        if (isMounted) {
          // Redirect to teacher dashboard if class is not found or unauthorized
          navigate('/teacher-dashboard', { replace: true })
        }
      } finally {
        if (isMounted) setClassLoading(false)
      }
    }

    // Simulate fetching question bank (independently)
    const fetchQuestions = async () => {
      setQuestionsLoading(true)
      setQuestionsError(false)
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No active session.')

        const data = await getClassQuestions({ accessToken: session.access_token, classId: id })
        if (isMounted) {
          setQuestions(data)
        }
      } catch (err) {
        if (isMounted) {
          setQuestionsError(err.message)
        }
      } finally {
        if (isMounted) setQuestionsLoading(false)
      }
    }

    fetchClassDetails()
    fetchQuestions()

    return () => { isMounted = false }
  }, [id])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      {/* Simple top nav just for back navigation */}
      <header className="px-6 py-4 flex items-center border-b" style={{ borderColor: '#E2DED8', backgroundColor: '#FDFCF9' }}>
        <Link
          to="/teacher-dashboard"
          className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
          style={{ color: '#8A94A6' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#16293B' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 md:py-12">
        
        {/* Class Details Section */}
        <section className="mb-12">
          {classError ? (
            <ErrorBanner>Could not load class details.</ErrorBanner>
          ) : classLoading ? (
            <SkeletonBlock height="120px" radius="1rem" />
          ) : classData ? (
            <ClassCodeDisplay 
              name={classData.name} 
              subject={classData.subject} 
              code={classData.class_code} 
            />
          ) : null}
        </section>

        {/* Question Bank Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: '#16293B' }}>
              Question bank
            </h2>
            <Button onClick={() => navigate(`/class/${id}/create-question`)} className="py-2 px-4 text-xs">
              Add question
            </Button>
          </div>

          {questionsError ? (
            <ErrorBanner>Could not load questions. Please try again later.</ErrorBanner>
          ) : questionsLoading ? (
            <div className="flex flex-col gap-3">
              <SkeletonBlock height="80px" radius="0.75rem" />
              <SkeletonBlock height="80px" radius="0.75rem" />
              <SkeletonBlock height="80px" radius="0.75rem" />
            </div>
          ) : questions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {questions.map(q => (
                <QuestionCard key={q.id} {...q} contentPreview={q.content} />
              ))}
            </div>
          ) : (
            <EmptyState
              heading="Your question bank is empty"
              body="Add your first question to start testing your students."
            />
          )}
        </section>

      </main>
    </div>
  )
}
