/**
 * SignaturePanel — the right-hand (or top-band on mobile) visual accent for auth pages.
 *
 * Contains:
 *  - Ink navy background
 *  - A full-bleed diagram image depicting the GapMap system:
 *    teacher sets questions → gap detected in student answers → gap closed
 *  - A short tagline beneath for context
 *
 * The image lives in /public/signature-panel.png.
 * It is intentionally static — no animation, no parallax.
 */
export default function SignaturePanel() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden"
      style={{ backgroundColor: '#16293B' }}
      aria-hidden="true"
    >
      {/* System diagram image — full-width, centered, constrained height */}
      <div className="w-full flex items-center justify-center px-6 py-8 flex-1">
        <img
          src="/signature-panel.png"
          alt="Diagram showing how GapMap works: a teacher sets questions, students answer, and the platform detects and helps close specific knowledge gaps."
          className="w-full h-full object-contain"
          style={{ maxWidth: '420px', maxHeight: '460px' }}
          /* aria-hidden is on the parent; this alt is for screen readers that pierce it */
          draggable="false"
        />
      </div>

      {/* Subtle bottom tagline */}
      <div
        className="w-full px-8 pb-8 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}
      >
        <p
          className="text-xs font-sans font-medium tracking-widest uppercase"
          style={{ color: '#8A94A6', letterSpacing: '0.1em' }}
        >
          Diagnosis, not just scoring
        </p>
      </div>
    </div>
  )
}
