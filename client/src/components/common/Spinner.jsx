/**
 * Spinner — small inline loading spinner.
 *
 * Props:
 *  - color: 'amber' | 'white' | 'ink'
 *  - size: number (pixels, default 16)
 */
export default function Spinner({ color = 'white', size = 16 }) {
  const colorMap = {
    amber: 'border-t-[#E2963C] border-[#E2963C]/30',
    white: 'border-t-white border-white/30',
    ink: 'border-t-[#16293B] border-[#16293B]/30',
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-2 animate-spin ${colorMap[color]}`}
      style={{ width: size, height: size }}
    />
  )
}
