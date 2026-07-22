/**
 * CreateQuestionPage — dynamic form for creating questions.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import FormField from '../components/auth/FormField.jsx'
import Button from '../components/common/Button.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import SkeletonBlock from '../components/common/SkeletonBlock.jsx'
import supabase from '../lib/supabaseClient.js'
import { getClassById } from '../services/classApi.js'
import { createQuestion } from '../services/questionApi.js'

// Shared type options
const TYPE_OPTIONS = [
  { id: 'mcq', label: 'MCQ' },
  { id: 'short', label: 'Short Answer' },
  { id: 'long', label: 'Long Answer' },
  { id: 'math', label: 'Math Workings' },
]

// Shared difficulty options
const DIFF_OPTIONS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

export default function CreateQuestionPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [className, setClassName] = useState('')
  const [classLoading, setClassLoading] = useState(true)

  const [type, setType] = useState('mcq')
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  
  // MCQ specific
  const [mcqOptions, setMcqOptions] = useState({ A: '', B: '', C: '', D: '' })
  const [correctAnswerId, setCorrectAnswerId] = useState('A')

  // Short/Long/Math specific
  const [expectedAnswer, setExpectedAnswer] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchClassDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const data = await getClassById({ accessToken: session.access_token, classId: id })
        if (isMounted) {
          setClassName(data.name)
          setClassLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setClassName('Unknown Class')
          setClassLoading(false)
        }
      }
    }
    fetchClassDetails()
    return () => { isMounted = false }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Basic Validation
    if (!topic.trim()) return setError('Topic is required.')
    if (!content.trim()) return setError('Question content is required.')

    if (type === 'mcq') {
      if (!mcqOptions.A.trim() || !mcqOptions.B.trim() || !mcqOptions.C.trim() || !mcqOptions.D.trim()) {
        return setError('All 4 MCQ options must be provided.')
      }
    } else {
      if (!expectedAnswer.trim()) {
        return setError('Expected answer / model solution is required.')
      }
    }

    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session.')

      let mappedCorrectAnswer = expectedAnswer
      let mappedOptions = undefined

      if (type === 'mcq') {
        mappedCorrectAnswer = mcqOptions[correctAnswerId]
        mappedOptions = [mcqOptions.A, mcqOptions.B, mcqOptions.C, mcqOptions.D]
      }

      await createQuestion({
        accessToken: session.access_token,
        class_id: id,
        topic: topic.trim(),
        type,
        difficulty,
        content: content.trim(),
        correct_answer: mappedCorrectAnswer.trim(),
        options: mappedOptions
      })

      setLoading(false)
      navigate(`/class/${id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // Segmented control renderer for type/difficulty
  const renderToggleGroup = (options, value, onChange, label) => (
    <fieldset className="border-0 m-0 p-0 mb-5">
      <legend className="block text-sm font-medium mb-2" style={{ color: '#26313D' }}>
        {label}
      </legend>
      <div
        className="flex rounded-lg p-1 overflow-x-auto no-scrollbar"
        style={{ backgroundColor: '#E8E6E0' }}
      >
        {options.map((opt) => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="flex-1 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer min-w-0"
              style={
                selected
                  ? {
                      backgroundColor: '#16293B',
                      color: '#F6F5F1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: '#8A94A6',
                    }
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F6F5F1' }}>
      <header className="px-6 py-4 flex items-center border-b" style={{ borderColor: '#E2DED8', backgroundColor: '#FDFCF9' }}>
        <Link
          to={`/class/${id}`}
          className="flex items-center gap-2 text-sm font-medium transition-colors duration-150"
          style={{ color: '#8A94A6' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#16293B' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
        >
          <ArrowLeft size={16} />
          Back to Class
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: '#16293B' }}>
            Add a question
          </h1>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#8A94A6' }}>
            Adding to: {classLoading ? <SkeletonBlock width="150px" height="20px" /> : <span className="font-medium text-slate-800">{className}</span>}
          </div>
        </div>

        {error && <ErrorBanner className="mb-6">{error}</ErrorBanner>}

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border" style={{ borderColor: '#E2DED8', backgroundColor: '#FDFCF9' }}>
          
          {renderToggleGroup(TYPE_OPTIONS, type, setType, 'Question Type')}
          {renderToggleGroup(DIFF_OPTIONS, difficulty, setDifficulty, 'Difficulty')}

          <div className="mb-5">
            <FormField
              id="topic"
              label="Topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Fractions"
              required
            />
          </div>

          <div className="mb-5 flex flex-col gap-1.5">
            <label htmlFor="content" className="block text-sm font-medium" style={{ color: '#26313D' }}>
              Question Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150 outline-none resize-y min-h-[100px]"
              style={{ backgroundColor: '#FDFCF9', borderColor: '#D5D2CB', color: '#26313D' }}
              onFocus={e => { e.target.style.borderColor = '#E2963C' }}
              onBlur={e => { e.target.style.borderColor = '#D5D2CB' }}
              required
            />
          </div>

          {/* Dynamic Sections */}
          <div className="mb-8 pt-4 border-t" style={{ borderColor: '#E2DED8' }}>
            {type === 'mcq' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-medium" style={{ color: '#26313D' }}>Options</h3>
                {['A', 'B', 'C', 'D'].map(letter => (
                  <FormField
                    key={letter}
                    id={`option-${letter}`}
                    label={`Option ${letter}`}
                    value={mcqOptions[letter]}
                    onChange={e => setMcqOptions({ ...mcqOptions, [letter]: e.target.value })}
                    required
                  />
                ))}
                <div className="mt-2 flex flex-col gap-1.5">
                  <label htmlFor="correct-answer" className="block text-sm font-medium" style={{ color: '#26313D' }}>
                    Correct Answer
                  </label>
                  <select
                    id="correct-answer"
                    value={correctAnswerId}
                    onChange={e => setCorrectAnswerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150 outline-none"
                    style={{ backgroundColor: '#FDFCF9', borderColor: '#D5D2CB', color: '#26313D' }}
                    onFocus={e => { e.target.style.borderColor = '#E2963C' }}
                    onBlur={e => { e.target.style.borderColor = '#D5D2CB' }}
                  >
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <option key={letter} value={letter}>
                        Option {letter} {mcqOptions[letter] ? `— ${mcqOptions[letter]}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {type === 'short' && (
              <FormField
                id="expected-answer"
                label="Expected Answer"
                value={expectedAnswer}
                onChange={e => setExpectedAnswer(e.target.value)}
                placeholder="e.g. 42"
                required
              />
            )}

            {type === 'long' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expected-answer" className="block text-sm font-medium" style={{ color: '#26313D' }}>
                  Model Answer
                </label>
                <textarea
                  id="expected-answer"
                  value={expectedAnswer}
                  onChange={e => setExpectedAnswer(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150 outline-none resize-y min-h-[150px]"
                  style={{ backgroundColor: '#FDFCF9', borderColor: '#D5D2CB', color: '#26313D' }}
                  onFocus={e => { e.target.style.borderColor = '#E2963C' }}
                  onBlur={e => { e.target.style.borderColor = '#D5D2CB' }}
                  required
                />
              </div>
            )}

            {type === 'math' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expected-answer" className="block text-sm font-medium" style={{ color: '#26313D' }}>
                  Full worked solution
                </label>
                <textarea
                  id="expected-answer"
                  value={expectedAnswer}
                  onChange={e => setExpectedAnswer(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150 outline-none resize-y min-h-[150px]"
                  style={{ backgroundColor: '#FDFCF9', borderColor: '#D5D2CB', color: '#26313D' }}
                  onFocus={e => { e.target.style.borderColor = '#E2963C' }}
                  onBlur={e => { e.target.style.borderColor = '#D5D2CB' }}
                  required
                />
                <p className="text-xs mt-1" style={{ color: '#8A94A6' }}>
                  Write each step on its own line — the AI will compare the student's steps against yours.
                </p>
              </div>
            )}
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Saving...' : 'Save question'}
          </Button>
        </form>
      </main>
    </div>
  )
}
