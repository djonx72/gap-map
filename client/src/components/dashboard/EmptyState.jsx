/**
 * EmptyState — a styled empty-state panel for dashboard list areas.
 *
 * Props:
 *  - icon: ReactNode — optional icon element
 *  - heading: string — the "nothing here yet" heading
 *  - body: string — what will appear here and what to do
 *  - role: 'teacher' | 'student'
 */
export default function EmptyState({ icon, heading, body }) {
  return (
    <div
      className="w-full rounded-2xl flex flex-col items-center justify-center px-8 py-16 text-center border-2 border-dashed"
      style={{
        borderColor: '#D5D2CB',
        backgroundColor: '#FDFCF9',
      }}
    >
      {/* Icon container */}
      {icon && (
        <div
          className="mb-5 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#F0EDE8' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h2
        className="font-display text-xl font-medium mb-2"
        style={{ color: '#16293B' }}
      >
        {heading}
      </h2>
      <p
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: '#8A94A6' }}
      >
        {body}
      </p>
    </div>
  )
}
