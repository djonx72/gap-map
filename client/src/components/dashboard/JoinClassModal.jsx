/**
 * JoinClassModal — modal for students to join a class using a code.
 */
import { useState, useEffect, useRef } from 'react'
import FormField from '../auth/FormField.jsx'
import Button from '../common/Button.jsx'
import ErrorBanner from '../common/ErrorBanner.jsx'
import supabase from '../../lib/supabaseClient.js'
import { joinClass } from '../../services/classApi.js'

export default function JoinClassModal({ isOpen, onClose, onJoinSuccess, preselectedClass }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setCode('')
      setError('')
      setSuccessMsg('')
      // Small delay to ensure render before focus
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter a class code.')
      return
    }

    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No active session.')

      const response = await joinClass({ accessToken: session.access_token, class_code: code })

      setSuccessMsg(`You've joined ${response.class.name}`)
      
      if (onJoinSuccess) {
        onJoinSuccess(response.class.name)
      }

      // Close after a short pause so user can read the success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-class-title"
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-hidden animate-fade-in"
      >
        <h2 id="join-class-title" className="text-xl font-semibold mb-2" style={{ color: '#16293B' }}>
          Join a class
        </h2>
        <p className="text-sm mb-6" style={{ color: '#8A94A6' }}>
          {preselectedClass 
            ? `Enter the class code to join ${preselectedClass}.` 
            : `Enter the class code your teacher gave you.`}
        </p>

        {error && (
          <div className="mb-5">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        {successMsg && (
          <div 
            className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#EDF2EC', color: '#7A9B76', border: '1px solid #c7d8c5' }}
            role="status"
            aria-live="polite"
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <label htmlFor="join-code-input" className="block text-sm font-medium mb-1.5" style={{ color: '#26313D' }}>
              Class code
            </label>
            <input
              ref={inputRef}
              id="join-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. X7K2P9"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all duration-150"
              style={{
                borderColor: '#E2DED8',
                backgroundColor: '#FFFFFF',
                color: '#16293B'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#16293B'
                e.currentTarget.style.boxShadow = '0 0 0 1px #16293B'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#E2DED8'
                e.currentTarget.style.boxShadow = 'none'
              }}
              disabled={loading || !!successMsg}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading || !!successMsg}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!!successMsg}>
              {loading ? 'Joining...' : 'Join class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
