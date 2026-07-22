/**
 * AuthButton — primary CTA button for auth forms.
 *
 * Props:
 *  - children: button label
 *  - loading: boolean — shows a spinner and disables interaction
 *  - type: 'button' | 'submit' (default: 'submit')
 *  - onClick: optional click handler
 */
export default function AuthButton({ children, loading = false, type = 'submit', onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
      style={{
        backgroundColor: loading ? '#c97d2c' : '#E2963C',
        color: '#FFFFFF',
        opacity: loading ? 0.85 : 1,
      }}
      onMouseEnter={e => {
        if (!loading) e.currentTarget.style.backgroundColor = '#c97d2c'
      }}
      onMouseLeave={e => {
        if (!loading) e.currentTarget.style.backgroundColor = '#E2963C'
      }}
    >
      {loading && (
        /* Simple CSS spinner — no dependency needed */
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
        />
      )}
      {children}
    </button>
  )
}
