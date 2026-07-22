/**
 * Button — a general-purpose button matching AuthButton's exact visual style.
 *
 * Props:
 *  - children: button label
 *  - loading: boolean — shows a spinner and disables interaction
 *  - type: 'button' | 'submit' (default: 'button')
 *  - onClick: optional click handler
 *  - variant: 'primary' (default, amber) | 'secondary' (ink border/text)
 *  - className: optional additional classes
 */
import Spinner from './Spinner.jsx'

export default function Button({ children, loading = false, type = 'button', onClick, variant = 'primary', className = '' }) {
  const isPrimary = variant === 'primary'

  const baseStyle = {
    backgroundColor: isPrimary ? (loading ? '#c97d2c' : '#E2963C') : 'transparent',
    color: isPrimary ? '#FFFFFF' : '#16293B',
    opacity: loading ? 0.85 : 1,
    border: isPrimary ? 'none' : '1px solid #16293B',
  }

  const handleMouseEnter = (e) => {
    if (!loading && isPrimary) e.currentTarget.style.backgroundColor = '#c97d2c'
    if (!loading && !isPrimary) {
      e.currentTarget.style.backgroundColor = '#16293B'
      e.currentTarget.style.color = '#FFFFFF'
    }
  }

  const handleMouseLeave = (e) => {
    if (!loading && isPrimary) e.currentTarget.style.backgroundColor = '#E2963C'
    if (!loading && !isPrimary) {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = '#16293B'
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <Spinner color={isPrimary ? 'white' : 'ink'} />
      )}
      {children}
    </button>
  )
}
