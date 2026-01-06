import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                {/* 404 Illustration */}
                <div className="mb-8">
                    <div className="relative inline-block">
                        <span className="text-[150px] font-heading font-bold text-gray-100">404</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#159DB3] to-[#214B9D] flex items-center justify-center shadow-lg">
                                <Search size={40} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="font-heading text-3xl font-bold text-gray-900 mb-3">
                    Page Not Found
                </h1>
                <p className="text-gray-500 mb-8">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/dashboard">
                        <Button size="lg" className="gap-2">
                            <Home size={18} />
                            Go to Dashboard
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>

                {/* Help Link */}
                <p className="text-gray-400 text-sm mt-12">
                    Need help? Contact support at{' '}
                    <a href="mailto:support@datasirena.com" className="text-[#159DB3] hover:underline">
                        support@datasirena.com
                    </a>
                </p>
            </div>
        </div>
    )
}
