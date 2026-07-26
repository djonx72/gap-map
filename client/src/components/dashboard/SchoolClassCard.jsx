/**
 * SchoolClassCard — a single class summary card for the student's school class list.
 * 
 * Props:
 *  - name: string
 *  - subject: string
 *  - teacherName: string
 *  - isEnrolled: boolean
 */

export default function SchoolClassCard({ name, subject, teacherName, isEnrolled, onClick }) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`group block p-6 bg-white rounded-xl border transition-all duration-150 text-left ${onClick ? 'outline-none focus-visible:ring-2 focus-visible:ring-[#E2963C]' : ''}`}
      style={{
        borderColor: '#E2DED8',
        backgroundColor: '#FDFCF9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        cursor: onClick ? 'pointer' : 'default',
        width: '100%',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#D5D2CB'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)'
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = '#E2DED8'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'
        }
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
          <div className="text-sm font-medium" style={{ color: '#26313D' }}>
            Taught by {teacherName}
          </div>
        </div>
        {isEnrolled && (
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#EDF2EC', color: '#7A9B76' }}
            aria-label="You are enrolled in this class"
          >
            Enrolled
          </div>
        )}
      </div>
    </Component>
  )
}
