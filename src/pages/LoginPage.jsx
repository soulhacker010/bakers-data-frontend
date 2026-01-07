import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Input } from '../components/ui'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(email, password)
            toast.success('Welcome back! Login successful.')
            navigate('/dashboard')
        } catch (err) {
            const errorMsg = err.message || 'Invalid email or password'
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image */}
                <img
                    src="/images/threpahy.jpg"
                    alt="Therapy Session"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay - matches our teal/blue brand colors, with transparency for image */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E8499]/90 via-[#159DB3]/80 to-[#214B9D]/85"></div>

                {/* Animated Background Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div>
                        <img src="/images/logo.png" alt="Data Sirena" className="h-20 w-auto mb-4" />
                        <p className="text-white/70 text-lg">Therapy Data Platform</p>
                    </div>

                    {/* Quote */}
                    <div className="max-w-md">
                        <div className="w-12 h-1 bg-white/30 rounded mb-6"></div>
                        <blockquote className="text-2xl font-heading font-medium leading-relaxed mb-4">
                            "Empowering growth through data-driven care and meaningful progress tracking."
                        </blockquote>
                        <p className="text-white/60 text-sm">
                            — Trusted by 500+ ABA therapists worldwide
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8">
                        <div>
                            <p className="text-3xl font-heading font-bold">10K+</p>
                            <p className="text-white/60 text-sm">Sessions tracked</p>
                        </div>
                        <div>
                            <p className="text-3xl font-heading font-bold">500+</p>
                            <p className="text-white/60 text-sm">Therapists</p>
                        </div>
                        <div>
                            <p className="text-3xl font-heading font-bold">98%</p>
                            <p className="text-white/60 text-sm">Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/images/logo.png" alt="Data Sirena" className="h-12 w-auto mx-auto mb-2" />
                        <p className="text-gray-500 mt-1">Therapy Data Platform</p>
                    </div>

                    {/* Welcome */}
                    <div className="mb-8">
                        <p className="label-uppercase mb-2">W E L C O M E &nbsp; B A C K</p>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                            Sign in to your account
                        </h2>
                        <p className="text-gray-500">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2 animate-shake">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div>
                            <label className="label-uppercase block mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="input-premium pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full py-4 text-base group"
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Create one now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
