/**
 * ClassCodeDisplay — prominent display for the class code with a copy button.
 *
 * Props:
 *  - name: string
 *  - subject: string
 *  - code: string
 */
import { useState, useRef } from 'react'

export default function ClassCodeDisplay({ name, subject, code }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="w-full rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border"
      style={{
        backgroundColor: '#FDFCF9',
        borderColor: '#E2DED8',
      }}
    >
      <div>
        <h1
          className="font-display text-3xl font-semibold mb-1"
          style={{ color: '#16293B' }}
        >
          {name}
        </h1>
        <p className="text-sm font-medium" style={{ color: '#8A94A6' }}>
          {subject}
        </p>
      </div>

      <div className="flex flex-col items-start md:items-end gap-2">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8A94A6' }}>
          Class Code
        </p>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-3xl md:text-4xl font-semibold tracking-wider"
            style={{ color: '#26313D' }}
          >
            {code}
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer"
            style={{
              backgroundColor: copied ? '#EAF3EA' : '#E8E6E0',
              color: copied ? '#3A6E37' : '#26313D',
            }}
            aria-live="polite"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      </div>
    </div>
  )
}
