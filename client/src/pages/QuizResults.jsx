import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import DashboardNav from '../components/dashboard/DashboardNav.jsx'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import TypeBadge from '../components/dashboard/TypeBadge.jsx'

export default function QuizResults() {
  const { id: classId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, logout } = useAuth()

  const [results, setResults] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const state = location.state || {}
    const realResults = state.results || []

    setResults(realResults)

    if (realResults.length > 0) {
      const correctCount = realResults.filter(r => r.is_correct).length
      setSummary({
        correct: correctCount,
        total: realResults.length,
        percentage: Math.round((correctCount / realResults.length) * 100)
      })
    }
  }, [location.state])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const name = profile?.full_name ?? ''
  const role = profile?.role ?? 'student'

  if (!summary || results.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
        <DashboardNav userName={name} role={role} onLogout={handleLogout} />
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
          <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: '#16293B' }}>
            No results found
          </h2>
          <p className="text-base mb-8" style={{ color: '#8A94A6' }}>
            We couldn't find any recent quiz results to display here.
          </p>
          <Button onClick={() => navigate('/student-dashboard')}>
            Back to dashboard
          </Button>
        </main>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      <DashboardNav userName={name} role={role} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 flex flex-col">
        
        {/* Score Summary */}
        <div className="text-center mb-12">
          <h1 
            className="font-display font-semibold mb-2" 
            style={{ fontSize: '5rem', lineHeight: '1', color: '#26313D' }}
          >
            {summary.percentage}%
          </h1>
          <p className="text-lg font-medium" style={{ color: '#8A94A6' }}>
            {summary.correct} out of {summary.total} correct
          </p>
        </div>

        {/* Question Cards */}
        <div className="flex flex-col gap-6 mb-12">
          {results.map((result, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-xl border p-6 shadow-sm"
              style={{ borderColor: '#E2DED8' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold" style={{ color: '#8A94A6' }}>Q{idx + 1}.</span>
                <TypeBadge type={result.question_type} />
                <span className="text-sm font-medium ml-2" style={{ color: '#8A94A6' }}>{result.topic}</span>
              </div>
              
              <h3 className="font-display text-xl font-medium mb-5" style={{ color: '#16293B' }}>
                {result.question_text}
              </h3>

              {/* Your Answer Block */}
              <div 
                className="mb-5 pl-4 py-1"
                style={{ borderLeft: '3px solid #E2DED8' }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8A94A6' }}>
                  Your answer
                </div>
                <p 
                  className="text-base leading-relaxed" 
                  style={{ color: '#26313D', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {result.student_answer}
                </p>
              </div>

              {/* Feedback Block */}
              {result.is_correct ? (
                <div 
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#EDF2EC', color: '#7A9B76' }}
                >
                  Nice work on this one.
                </div>
              ) : (
                <div 
                  className="rounded-lg p-5 flex flex-col gap-4"
                  style={{ backgroundColor: '#F8F9FA', border: '1px solid #EAECEF' }}
                >
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8A94A6' }}>
                      Area to review
                    </h4>
                    <p className="text-sm font-medium" style={{ color: '#26313D' }}>
                      {result.root_gap}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8A94A6' }}>
                      Feedback
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: '#26313D' }}>
                      {result.explanation}
                    </p>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        <div className="flex justify-center border-t pt-8" style={{ borderColor: '#E2DED8' }}>
          <Button onClick={() => navigate('/student-dashboard')}>
            Back to dashboard
          </Button>
        </div>

      </main>
    </div>
  )
}
