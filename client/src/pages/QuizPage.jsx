import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import Button from '../components/common/Button.jsx'
import TypeBadge from '../components/dashboard/TypeBadge.jsx'
import DifficultyBadge from '../components/dashboard/DifficultyBadge.jsx'
import Spinner from '../components/common/Spinner.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import supabase from '../lib/supabaseClient.js'
import { getQuizQuestions, submitQuiz } from '../services/submissionApi.js'

export default function QuizPage() {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const { profile, logout } = useAuth()

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // store answers mapped by question id
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [validationError, setValidationError] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No active session.')

      const fetchedQuestions = await getQuizQuestions({ accessToken: session.access_token, classId })
      setQuestions(fetchedQuestions)
    } catch (err) {
      setError(err.message || 'Could not load quiz questions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [classId])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      setValidationError('Write an answer before continuing.')
      return
    }

    setValidationError('')
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: currentAnswer }))

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer(answers[questions[currentIndex + 1].id] || '')
    } else {
      submitQuizHandler()
    }
  }

  const submitQuizHandler = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No active session.')

      const finalAnswersArray = Object.entries({ ...answers, [questions[currentIndex].id]: currentAnswer })
        .map(([qId, aContent]) => ({ question_id: qId, answer_content: aContent }))

      const response = await submitQuiz({
        accessToken: session.access_token,
        answers: finalAnswersArray
      })

      navigate(`/student/class/${classId}/results`, { state: { results: response.results } })
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit quiz.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F1]">
        <Spinner color="ink" />
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center text-center p-6" 
        style={{ backgroundColor: '#F6F5F1' }}
        aria-live="assertive"
      >
        <h2 className="font-display text-2xl font-semibold mb-6" style={{ color: '#16293B' }}>
          Analysing your answers...
        </h2>
        <Spinner color="ink" />
        <p className="mt-6 text-sm" style={{ color: '#8A94A6' }}>
          This may take a moment. Please don't close this page.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
        <DashboardNav userName={profile?.full_name ?? ''} role={profile?.role ?? 'student'} onLogout={handleLogout} />
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
          <ErrorBanner>{error}</ErrorBanner>
          <div className="mt-4">
            <Button onClick={fetchQuestions}>Try again</Button>
          </div>
        </main>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
        <DashboardNav userName={profile?.full_name ?? ''} role={profile?.role ?? 'student'} onLogout={handleLogout} />
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
          <p className="text-center text-lg mt-10" style={{ color: '#8A94A6' }}>No questions available for this class.</p>
        </main>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const renderInput = () => {
    if (currentQuestion.type === 'mcq') {
      return (
        <div className="flex flex-col gap-3">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = currentAnswer === opt
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCurrentAnswer(opt)
                  setValidationError('')
                }}
                className="w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-base outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16293B]"
                style={{
                  backgroundColor: isSelected ? '#16293B' : '#FFFFFF',
                  borderColor: isSelected ? '#16293B' : '#E2DED8',
                  color: isSelected ? '#FFFFFF' : '#26313D',
                  boxShadow: isSelected ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )
    }

    const isMultiline = currentQuestion.type === 'long' || currentQuestion.type === 'math'
    const charCount = currentAnswer.length
    const maxChars = 2000
    const showCounter = charCount > maxChars * 0.85

    return (
      <div className="flex flex-col gap-2">
        {currentQuestion.type === 'math' && (
          <p className="text-sm font-medium" style={{ color: '#8A94A6' }}>Write each step on its own line</p>
        )}
        {isMultiline ? (
          <textarea
            value={currentAnswer}
            onChange={(e) => {
              setCurrentAnswer(e.target.value.slice(0, maxChars))
              setValidationError('')
            }}
            placeholder="Type your answer here..."
            className="w-full p-4 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16293B] resize-none"
            style={{ borderColor: '#E2DED8', color: '#26313D', minHeight: '160px' }}
          />
        ) : (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => {
              setCurrentAnswer(e.target.value.slice(0, maxChars))
              setValidationError('')
            }}
            placeholder="Type your answer here..."
            className="w-full p-4 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16293B]"
            style={{ borderColor: '#E2DED8', color: '#26313D' }}
          />
        )}
        
        {showCounter && (
          <div className="text-right text-xs" style={{ color: '#8A94A6' }}>
            {charCount} / {maxChars}
          </div>
        )}
      </div>
    )
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100

  const name = profile?.full_name ?? ''
  const role = profile?.role ?? 'student'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      <DashboardNav userName={name} role={role} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
        
        <div className="mb-8" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: '#8A94A6' }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <div 
            className="w-full h-1.5 rounded-full overflow-hidden" 
            style={{ backgroundColor: 'rgba(138, 148, 166, 0.2)' }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div 
              className="h-full transition-all duration-300 ease-out" 
              style={{ width: `${progressPercent}%`, backgroundColor: '#E2963C' }} 
            />
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-2xl border shadow-sm flex-1 flex flex-col" style={{ borderColor: '#E2DED8' }}>
          
          <div className="flex items-center gap-3 mb-6">
            <TypeBadge type={currentQuestion.type} />
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-semibold mb-10 leading-snug" style={{ color: '#16293B' }}>
            {currentQuestion.content}
          </h1>

          <div className="flex-1">
            {renderInput()}
            {validationError && (
              <p className="mt-2 text-sm font-medium" style={{ color: '#C0463E' }}>
                {validationError}
              </p>
            )}
            {submitError && (
              <div className="mt-4">
                <ErrorBanner>{submitError}</ErrorBanner>
              </div>
            )}
          </div>

          <div className="mt-12 flex justify-end pt-6 border-t" style={{ borderColor: '#F0EFEA' }}>
            <Button
              onClick={handleNext}
              variant={isLast ? 'primary' : 'secondary'}
            >
              {isLast ? 'Submit quiz' : 'Next question'}
            </Button>
          </div>
          
        </div>
      </main>
    </div>
  )
}
