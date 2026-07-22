/**
 * DashboardNav — top navigation bar for Teacher and Student dashboards.
 *
 * Props:
 *  - userName: string
 *  - role: 'teacher' | 'student'
 *  - onLogout: () => void (visual only — no real logout logic)
 *
 * Layout: GapMap wordmark (left) | user name + role badge + logout (right)
 */
import GapMapLogo from '../common/GapMapLogo.jsx'
import { LogOut } from 'lucide-react'

export default function DashboardNav({ userName, role, onLogout }) {
  const roleBadge = {
    teacher: { label: 'Teacher', bg: '#E8F0E8', color: '#4A7A46' },
    student: { label: 'Student', bg: '#E8EEF5', color: '#2E5E8E' },
  }[role] ?? { label: role, bg: '#E8E6E0', color: '#8A94A6' }

  return (
    <header
      className="w-full px-6 py-4 flex items-center justify-between border-b"
      style={{ backgroundColor: '#FDFCF9', borderColor: '#E2DED8' }}
    >
      {/* Left — wordmark */}
      <GapMapLogo size="md" />

      {/* Right — user info + logout */}
      <div className="flex items-center gap-4">
        {/* User name + role badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium" style={{ color: '#26313D' }}>
            {userName}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
          >
            {roleBadge.label}
          </span>
        </div>

        {/* Divider */}
        <span className="hidden sm:block w-px h-5" style={{ backgroundColor: '#D5D2CB' }} />

        {/* Logout button — visual only */}
        <button
          type="button"
          id="btn-logout"
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer px-1"
          style={{ color: '#8A94A6' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#26313D' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A94A6' }}
          aria-label="Log out"
        >
          <LogOut size={15} aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  )
}
