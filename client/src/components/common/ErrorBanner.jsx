/**
 * ErrorBanner — text-only banner using the brick red colors.
 *
 * Props:
 *  - children: the error message
 *  - className: optional additional classes
 */
export default function ErrorBanner({ children, className = '' }) {
  if (!children) return null

  return (
    <div
      role="alert"
      className={`px-4 py-3 rounded-lg text-sm font-medium ${className}`}
      style={{
        backgroundColor: 'var(--color-brick-light)',
        color: 'var(--color-brick)',
        border: '1px solid #ebcdc9' // slightly darker than the light bg for subtle definition
      }}
    >
      {children}
    </div>
  )
}
