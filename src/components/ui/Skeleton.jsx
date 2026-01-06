// Skeleton loading components for shimmer effects

export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`animate-pulse bg-gray-200 rounded ${className}`}
            {...props}
        />
    )
}

// Card skeleton for client/program cards
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-4">
                {/* Avatar skeleton */}
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-6 w-48 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                </div>

                {/* Button skeleton */}
                <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
        </div>
    )
}

// List skeleton for multiple cards
export function ListSkeleton({ count = 3 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 rounded ${i === 0 ? 'w-32' : 'flex-1'}`}
                />
            ))}
        </div>
    )
}

// Stat card skeleton
export function StatSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <Skeleton className="h-4 w-20 rounded mb-3" />
            <Skeleton className="h-8 w-16 rounded mb-2" />
            <Skeleton className="h-3 w-24 rounded" />
        </div>
    )
}

// Profile/header skeleton
export function ProfileSkeleton() {
    return (
        <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
            </div>
        </div>
    )
}

// Chart skeleton
export function ChartSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    )
}

export default Skeleton
