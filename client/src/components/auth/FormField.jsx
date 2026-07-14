/**
 * FormField — a labeled input wrapper.
 *
 * Props:
 *  - id: string (required — links label to input)
 *  - label: string
 *  - type: input type (default: 'text')
 *  - value: string
 *  - onChange: (e) => void
 *  - placeholder: string (supplemental hint — not a substitute for the label)
 *  - helperText: string (optional note beneath the field)
 *  - error: string (optional — shows an error message)
 *  - autoComplete: string
 *  - required: boolean
 *  - children: any (optional — for suffix slots like show/hide password)
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  helperText,
  error,
  autoComplete,
  required = false,
  children,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: '#26313D' }}
      >
        {label}
        {required && (
          <span className="sr-only"> (required)</span>
        )}
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-describedby={
            [helperText && `${id}-helper`, error && `${id}-error`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={error ? 'true' : undefined}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors duration-150 outline-none"
          style={{
            backgroundColor: '#FDFCF9',
            borderColor: error ? '#c0392b' : '#D5D2CB',
            color: '#26313D',
            paddingRight: children ? '2.75rem' : undefined,
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? '#c0392b' : '#E2963C'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#c0392b' : '#D5D2CB'
          }}
        />
        {/* Suffix slot — used for show/hide password toggle */}
        {children && (
          <div className="absolute right-3 flex items-center">
            {children}
          </div>
        )}
      </div>

      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs" style={{ color: '#8A94A6' }}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs" style={{ color: '#c0392b' }}>
          {error}
        </p>
      )}
    </div>
  )
}
