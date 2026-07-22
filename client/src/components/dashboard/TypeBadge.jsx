/**
 * TypeBadge — small pill labeling a question type.
 *
 * Props:
 *  - type: 'mcq' | 'short' | 'long' | 'math'
 */
export default function TypeBadge({ type }) {
  const styles = {
    mcq:   { label: 'Multiple Choice', bg: '#7A9B76', color: '#F6F5F1', border: '1px solid #7A9B76' }, // Filled Sage
    short: { label: 'Short Answer',    bg: 'transparent', color: '#26313D', border: '1px solid #8A94A6' }, // Outlined Slate
    long:  { label: 'Long Answer',     bg: '#16293B', color: '#F6F5F1', border: '1px solid #16293B' }, // Filled Ink Navy
    math:  { label: 'Math Workings',   bg: 'transparent', color: '#26313D', border: '1px solid #26313D' }, // Outlined Charcoal
  }

  const config = styles[type] || styles.short

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color, border: config.border }}
    >
      {config.label}
    </span>
  )
}
