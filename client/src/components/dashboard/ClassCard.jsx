/**
 * ClassCard — a single class summary card for the teacher's class list.
 * Clickable to navigate to the class's dashboard.
 *
 * Props:
 *  - id: string
 *  - name: string
 *  - subject: string
 *  - code: string
 */
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function ClassCard({ id, name, subject, code }) {
  return (
    <Link
      to={`/class/${id}`}
      className="group block p-6 bg-white rounded-xl border transition-all duration-150 outline-none"
      style={{
        borderColor: '#E2DED8',
        backgroundColor: '#FDFCF9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#D5D2CB'
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2DED8'
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
      }}
      onFocus={e => {
        e.currentTarget.style.outline = '2px solid #E2963C'
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={e => {
        e.currentTarget.style.outline = 'none'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: '#16293B' }}>
            {name}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#8A94A6' }}>
            {subject}
          </p>
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium"
            style={{ backgroundColor: '#E8E6E0', color: '#26313D' }}
          >
            {code}
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
          style={{ backgroundColor: '#F0EDE8', color: '#8A94A6' }}
        >
          <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  )
}
