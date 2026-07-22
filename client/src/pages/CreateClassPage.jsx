/**
 * CreateClassPage — single-purpose form page for creating a new class.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import FormField from '../components/auth/FormField.jsx'
import Button from '../components/common/Button.jsx'
import ErrorBanner from '../components/common/ErrorBanner.jsx'
import GapMapLogo from '../components/common/GapMapLogo.jsx'
import supabase from '../lib/supabaseClient.js'
import { createClass } from '../services/classApi.js'

export default function CreateClassPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim() || !subject.trim()) {
      setError('Both class name and subject are required.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session found.')
      }

      const newClass = await createClass({ 
        accessToken: session.access_token, 
        name: name.trim(), 
        subject: subject.trim() 
      })

      // On success, redirect to the new class dashboard
      navigate(`/class/${newClass.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#F6F5F1' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: '#E2DED8', backgroundColor: '#FDFCF9' }}>
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <GapMapLogo size="md" />
          </div>
          <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: '#16293B' }}>
            Create a new class
          </h1>
          <p className="text-sm" style={{ color: '#8A94A6' }}>
            Set up a space for your students to join.
          </p>
        </div>

        {error && (
          <ErrorBanner className="mb-6">
            {error}
          </ErrorBanner>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField
            id="class-name"
            label="Class Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. JHS 2A Mathematics"
            required
          />

          <FormField
            id="class-subject"
            label="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />

          <div className="pt-2">
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Creating...' : 'Create class'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/teacher-dashboard"
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: '#8A94A6' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#26313D' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
