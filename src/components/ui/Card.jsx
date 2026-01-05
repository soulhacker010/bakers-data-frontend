import { forwardRef } from 'react'

const Card = forwardRef(({
    children,
    className = '',
    hover = false,
    onClick,
    ...props
}, ref) => {
    const hoverClasses = hover || onClick ? 'cursor-pointer hover:border-primary' : ''

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={`card-premium ${hoverClasses} ${className}`}
            {...props}
        >
            {children}
        </div>
    )
})

Card.displayName = 'Card'

// Card subcomponents
const CardHeader = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = '' }) => (
    <h3 className={`font-heading text-xl font-bold text-gray-900 ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = '' }) => (
    <p className={`text-gray-500 text-sm ${className}`}>{children}</p>
)

const CardContent = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
)

const CardFooter = ({ children, className = '' }) => (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>
)

export default Card
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
