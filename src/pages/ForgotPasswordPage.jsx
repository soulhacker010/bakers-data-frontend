import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../services/auth'
import { useToast } from '../context/ToastContext'
import { Button, Input } from '../components/ui'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { toast } = useToast()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await forgotPassword(email)
            // Always show success for security
            toast.success('If an account exists, a code has been sent.')
            // Redirect to reset page with email pre-filled
            navigate(`/reset-password?email=${encodeURIComponent(email)}`)
        } catch (err) {
            setError('Something went wrong. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image (Consistent with Login) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    src="/images/threpahy.jpg"
                    alt="Therapy Session"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E8499]/90 via-[#159DB3]/80 to-[#214B9D]/85"></div>
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <img src="/images/logo.png" alt="Data Sirena" className="h-20 w-auto mb-4" />
                        <p className="text-white/70 text-lg">Secure Recovery</p>
                    </div>
                    <div className="max-w-md">
                        <blockquote className="text-2xl font-heading font-medium leading-relaxed mb-4">
                            "Don't worry, it happens to the best of us. We'll get you back on track."
                        </blockquote>
                    </div>
                    <div className="text-sm text-white/60">
                        &copy; {new Date().getFullYear()} Data Sirena
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/images/logo.png" alt="Data Sirena" className="h-12 w-auto mx-auto mb-2" />
                    </div>

                    <div className="mb-8">
                        <Link to="/login" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Sign In
                        </Link>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                            Forgot Password?
                        </h2>
                        <p className="text-gray-500">
                            Enter your email to receive a secure recovery code.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full py-4 text-base group"
                        >
                            {loading ? 'Sending Code...' : (
                                <>
                                    Send Reset Code
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
