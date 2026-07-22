/**
 * SkeletonBlock — a reusable skeleton primitive.
 *
 * Props:
 *  - width: string (default '100%')
 *  - height: string (default '1rem')
 *  - radius: string (default '0.5rem')
 *  - className: optional additional classes
 */
export default function SkeletonBlock({ width = '100%', height = '1rem', radius = '0.5rem', className = '' }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: '#E8E6E0', // Muted warm-gray tone that reads as loading against Paper (#F6F5F1)
      }}
      aria-hidden="true"
    />
  )
}
