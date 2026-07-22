/**
 * DifficultyBadge — small pill for Easy / Medium / Hard.
 *
 * Props:
 *  - level: 'easy' | 'medium' | 'hard'
 */
export default function DifficultyBadge({ level }) {
  const styles = {
    easy:   { label: 'Easy',   bg: 'transparent', color: '#8A94A6', border: '1px solid #8A94A6' }, // Light outline (Slate)
    medium: { label: 'Medium', bg: '#8A94A6', color: '#F6F5F1', border: '1px solid #8A94A6' }, // Filled Slate
    hard:   { label: 'Hard',   bg: '#16293B', color: '#F6F5F1', border: '1px solid #16293B' }, // Solid filled Ink Navy
  }

  const config = styles[level] || styles.medium

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color, border: config.border }}
    >
      {config.label}
    </span>
  )
}
