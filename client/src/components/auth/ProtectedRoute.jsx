/**
 * ProtectedRoute.jsx — route guard for authenticated and role-gated pages.
 *
 * Props:
 *  - children:     JSX to render if access is allowed.
 *  - allowedRole:  Optional. 'teacher' | 'student'. If omitted, any authenticated
 *                  user is allowed.
 *
 * Behaviour:
 *  - While loading: render a minimal inline loading indicator (no redirect yet).
 *  - Not authenticated: redirect to /login.
 *  - Authenticated but wrong role: redirect to /login.
 *  - Authenticated and role matches (or no role required): render children.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F6F5F1',
        }}
        aria-label="Loading…"
        role="status"
      >
        <span
          className="animate-spin"
          style={{
            display: 'inline-block',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: '3px solid #E2DED8',
            borderTopColor: '#E2963C',
          }}
          aria-hidden="true"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && profile?.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  return children
}
