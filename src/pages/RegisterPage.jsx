import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Turnstile from 'react-turnstile'
import { useToast } from '../context/ToastContext'
import { Button, Input, Select } from '../components/ui'
import { Eye, EyeOff, Check, ArrowRight } from 'lucide-react'
import api from '../services/api'

const roleOptions = [
    { value: 'BCBA', label: 'BCBA (Board Certified Behavior Analyst)' },
    { value: 'RBT', label: 'RBT (Registered Behavior Technician)' },
    { value: 'Therapist', label: 'Therapist' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Other', label: 'Other' },
]

export default function RegisterPage() {
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { toast } = useToast()
    const navigate = useNavigate()

    // Password strength checks
    const hasLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            toast.error('Passwords do not match')
            return
        }

        if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
            setError('Password does not meet requirements')
            toast.error('Password does not meet requirements')
            return
        }

        if (!turnstileToken) {
            setError('Please complete the CAPTCHA')
            toast.error('Please complete the CAPTCHA')
            return
        }

        setLoading(true)

        try {
            await api.post('/api/auth/register', {
                full_name: fullName,
                email,
                password,
                role: role || 'Therapist',
                turnstile_token: turnstileToken
            })

            toast.success('Account created! Enter the verification code sent to your email.')
            // Redirect to verification page with email
            navigate(`/verify-code?email=${encodeURIComponent(email)}`)
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Registration failed'
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const PasswordCheck = ({ met, text }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${met ? 'bg-green-100' : 'bg-gray-100'}`}>
                {met && <Check size={10} />}
            </div>
            {text}
        </div>
    )

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image */}
                <img
                    src="/images/threpahysession.jpg"
                    alt="Therapy Session"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E8499]/90 via-[#159DB3]/80 to-[#214B9D]/85"></div>

                {/* Animated Background Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-40 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 left-20 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    {/* Logo */}
                    <div>
                        <img src="/images/logo.png" alt="Data Sirena" className="h-20 w-auto mb-4" />
                        <p className="text-white/70 text-lg">Therapy Data Platform</p>
                    </div>

                    {/* Features */}
                    <div className="max-w-md space-y-6">
                        <div className="w-12 h-1 bg-white/30 rounded mb-6"></div>
                        <h2 className="text-2xl font-heading font-medium">
                            Start your journey with us
                        </h2>

                        <div className="space-y-4">
                            {[
                                'Track client progress with precision',
                                'Generate insightful reports instantly',
                                'Collaborate with your therapy team',
                                'Secure and HIPAA-compliant platform'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                    <span className="text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {['JD', 'SK', 'MR', 'AT'].map((initials, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-semibold">
                                    {initials}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="font-medium">Join 500+ therapists</p>
                            <p className="text-white/60 text-sm">Already using Data Sirena</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/images/logo.png" alt="Data Sirena" className="h-12 w-auto mx-auto mb-2" />
                        <p className="text-gray-500 mt-1">Therapy Data Platform</p>
                    </div>

                    {/* Welcome */}
                    <div className="mb-8">
                        <p className="label-uppercase mb-2">G E T &nbsp; S T A R T E D</p>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                            Create your account
                        </h2>
                        <p className="text-gray-500">
                            Join thousands of therapists improving outcomes
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            minLength={2}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Select
                            label="Role / Certification"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            options={roleOptions}
                            placeholder="Select your role..."
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

                            {/* Password Requirements */}
                            {password && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <PasswordCheck met={hasLength} text="8+ characters" />
                                    <PasswordCheck met={hasUpper} text="Uppercase" />
                                    <PasswordCheck met={hasLower} text="Lowercase" />
                                    <PasswordCheck met={hasNumber} text="Number" />
                                </div>
                            )}
                        </div>

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        {/* Turnstile CAPTCHA */}
                        <div className="flex justify-center my-4">
                            <Turnstile
                                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onVerify={(token) => setTurnstileToken(token)}
                                theme="light"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={!turnstileToken}
                            className="w-full py-4 text-base mt-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : (
                                <>
                                    Create Account
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
