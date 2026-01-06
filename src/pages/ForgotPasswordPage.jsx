import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            // Mock API call - will connect to backend later
            console.log('Sending password reset email to:', email)
            await new Promise(resolve => setTimeout(resolve, 1000))

            setSent(true)
            toast.success('Password reset email sent!')
        } catch (err) {
            toast.error('Failed to send reset email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    src="/images/login-bg.jpg"
                    alt="Data Sirena"
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#159DB3]/80 to-[#214B9D]/80"></div>
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white">
                        <img
                            src="/images/logo.png"
                            alt="Data Sirena"
                            className="h-20 mx-auto mb-8 drop-shadow-lg"
                        />
                        <h2 className="font-heading text-3xl font-bold mb-4">
                            Forgot Your Password?
                        </h2>
                        <p className="text-white/80 text-lg max-w-md mx-auto">
                            No worries! We'll send you a reset link to get you back into your account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img
                            src="/images/logo.png"
                            alt="Data Sirena"
                            className="h-12 mx-auto mb-4"
                        />
                    </div>

                    {/* Back to Login */}
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>

                    {!sent ? (
                        <>
                            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                                Reset Password
                            </h1>
                            <p className="text-gray-500 mb-8">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Email Address"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    icon={<Mail size={18} className="text-gray-400" />}
                                    required
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    loading={loading}
                                >
                                    Send Reset Link
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                                Check Your Email
                            </h1>
                            <p className="text-gray-500 mb-8">
                                We've sent a password reset link to <strong>{email}</strong>.
                                Click the link in the email to reset your password.
                            </p>
                            <p className="text-gray-400 text-sm mb-6">
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setSent(false)}
                                    className="text-[#159DB3] hover:underline"
                                >
                                    try again
                                </button>
                            </p>
                            <Link to="/login">
                                <Button variant="outline" className="w-full">
                                    Return to Login
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Footer */}
                    <p className="text-center text-gray-400 text-sm mt-12">
                        Remember your password?{' '}
                        <Link to="/login" className="text-[#159DB3] hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
