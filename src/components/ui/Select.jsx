import { forwardRef } from 'react'

const Select = forwardRef(({
    label,
    error,
    options = [],
    placeholder = 'Select...',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    return (
        <div className={containerClassName}>
            {label && (
                <label className="label-uppercase block mb-2">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`input-premium ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    )
})

Select.displayName = 'Select'

export default Select
