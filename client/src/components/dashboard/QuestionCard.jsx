/**
 * QuestionCard — a single question bank row.
 *
 * Props:
 *  - type: 'mcq' | 'short' | 'long' | 'math'
 *  - difficulty: 'easy' | 'medium' | 'hard'
 *  - topic: string
 *  - contentPreview: string
 *  - correct_answer: string — the correct answer text (all types)
 *  - options: string[] | undefined — the 4 MCQ option strings [A, B, C, D] (mcq only)
 */
import { useState, useRef } from 'react'
import TypeBadge from './TypeBadge.jsx'
import DifficultyBadge from './DifficultyBadge.jsx'

export default function QuestionCard({ type, difficulty, topic, contentPreview, correct_answer, options }) {
  const [expanded, setExpanded] = useState(false)
  const answerRef = useRef(null)

  return (
    <div
      className="p-5 rounded-xl border flex flex-col sm:flex-row sm:items-start gap-4"
      style={{
        backgroundColor: '#FDFCF9',
        borderColor: '#E2DED8',
      }}
    >
      <div className="flex-1 min-w-0">
        {/* ── Collapsed header — unchanged appearance ────────────────────────── */}
        <div className="flex items-center gap-2 mb-2">
          <TypeBadge type={type} />
          <DifficultyBadge level={difficulty} />
          <span className="text-sm font-medium ml-2" style={{ color: '#8A94A6' }}>
            {topic}
          </span>
        </div>
        <p
          className="text-sm leading-relaxed truncate"
          style={{ color: '#26313D' }}
        >
          {contentPreview}
        </p>

        {/* ── Show/Hide toggle ───────────────────────────────────────────────── */}
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-xs font-medium transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0"
          style={{ color: '#8A94A6' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#26313D' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
        >
          {expanded ? 'Hide answer' : 'Show answer'}
        </button>

        {/* ── Expandable answer section ──────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            opacity: expanded ? 1 : 0,
            transition: 'grid-template-rows 220ms ease, opacity 200ms ease',
          }}
          aria-hidden={!expanded}
        >
          {/* Inner wrapper needed for grid-template-rows animation to work */}
          <div style={{ overflow: 'hidden' }}>
            <div
              className="mt-4 pt-4"
              style={{ borderTop: '1px solid #E4E2D8' }}
            >
              {type === 'mcq' && Array.isArray(options) ? (
                // MCQ: show all 4 options, correct one distinguished by weight + sage left border
                <ul className="flex flex-col gap-2" role="list">
                  {options.map((option, i) => {
                    const label = ['A', 'B', 'C', 'D'][i]
                    const isCorrect = option === correct_answer
                    return (
                      <li
                        key={label}
                        className="flex items-start gap-2.5 pl-3 py-0.5 text-sm rounded-sm"
                        style={{
                          borderLeft: isCorrect
                            ? '3px solid #7A9B76'
                            : '3px solid transparent',
                          fontWeight: isCorrect ? 600 : 400,
                          color: isCorrect ? '#26313D' : '#8A94A6',
                        }}
                      >
                        <span
                          className="shrink-0 text-xs font-semibold w-4"
                          style={{ color: isCorrect ? '#7A9B76' : '#8A94A6' }}
                        >
                          {label}.
                        </span>
                        <span>{option}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                // short / long / math: show correct_answer text, preserving line breaks for math
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: '#26313D',
                    whiteSpace: 'pre-wrap',  // preserves step-per-line formatting for math
                    wordBreak: 'break-word',
                  }}
                >
                  {correct_answer}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
