/**
 * RoleToggle — a segmented control for choosing between Teacher and Student roles.
 *
 * Props:
 *  - value: 'teacher' | 'student'
 *  - onChange: (role) => void
 */
import { GraduationCap, BookOpen } from 'lucide-react'

export default function RoleToggle({ value, onChange }) {
  const options = [
    { id: 'teacher', label: "I'm a teacher", Icon: GraduationCap },
    { id: 'student', label: "I'm a student", Icon: BookOpen },
  ]

  return (
    <fieldset className="border-0 m-0 p-0">
      <legend className="block text-sm font-medium mb-2" style={{ color: '#26313D' }}>
        I am joining as
      </legend>

      <div
        className="flex rounded-lg p-1"
        style={{ backgroundColor: '#E8E6E0' }}
        role="radiogroup"
        aria-label="Select your role"
      >
        {options.map(({ id, label, Icon }) => {
          const selected = value === id
          return (
            <button
              key={id}
              type="button"
              id={`role-${id}`}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer"
              style={
                selected
                  ? {
                      backgroundColor: '#16293B',
                      color: '#F6F5F1',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: '#8A94A6',
                    }
              }
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
