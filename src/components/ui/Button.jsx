import { forwardRef } from 'react'

const variants = {
    primary: 'btn-primary-premium',
    outline: 'btn-outline-premium',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 rounded-xl font-semibold',
    link: 'text-primary font-medium hover:underline',
}

const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
    icon: 'p-2',
}

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    className = '',
    disabled = false,
    loading = false,
    ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
            ) : icon ? (
                icon
            ) : null}
            {children}
            {iconRight && !loading && iconRight}
        </button>
    )
})

Button.displayName = 'Button'

export default Button
