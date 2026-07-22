/**
 * GapMapLogo — the product wordmark.
 * Renders as an SVG logotype with the amber accent on the "Gap" portion
 * and ink navy on "Map".
 */
export default function GapMapLogo({ size = 'md', inverted = false }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <span
      className={`font-display font-semibold tracking-tight select-none ${sizeClasses[size]}`}
      aria-label="GapMap"
    >
      <span style={{ color: inverted ? '#E2963C' : '#E2963C' }}>Gap</span>
      <span style={{ color: inverted ? '#F6F5F1' : '#16293B' }}>Map</span>
    </span>
  )
}
