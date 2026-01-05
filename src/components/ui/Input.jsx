import { forwardRef } from 'react'

const Input = forwardRef(({
    label,
    error,
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
            <input
                ref={ref}
                className={`input-premium ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    )
})

Input.displayName = 'Input'

export default Input
