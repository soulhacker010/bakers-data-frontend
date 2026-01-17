import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Turnstile from 'react-turnstile'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Input } from '../components/ui'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Shield, RefreshCw } from 'lucide-react'
import { verifyLoginOTP, resendLoginOTP } from '../services/auth'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState('')
    const [turnstileKey, setTurnstileKey] = useState(0)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // OTP Step State
    const [otpStep, setOtpStep] = useState(false)
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
    const [maskedEmail, setMaskedEmail] = useState('')
    const [rememberDevice, setRememberDevice] = useState(true)
    const [resendCooldown, setResendCooldown] = useState(0)
    const otpInputs = useRef([])

    const { login, setUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!turnstileToken) {
            setError('Please complete the CAPTCHA')
            toast.error('Please complete the CAPTCHA')
            return
        }

        setLoading(true)

        try {
            const result = await login({ email, password, turnstile_token: turnstileToken })

            // Check if OTP is required
            if (result.otp_required) {
                setMaskedEmail(result.email_masked)
                setOtpStep(true)
                setResendCooldown(60) // Start 60s cooldown
                toast.info('Verification code sent to your email')
                setLoading(false)
                return
            }

            // Normal login success
            toast.success('Welcome back! Login successful.')
            navigate('/dashboard')
        } catch (err) {
            const errorMsg = err.message || 'Invalid email or password'
            setError(errorMsg)
            toast.error(errorMsg)
            setTurnstileToken('')
            setTurnstileKey(prev => prev + 1)
        } finally {
            setLoading(false)
        }
    }

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6)
            const newOtp = [...otpCode]
            digits.split('').forEach((digit, i) => {
                if (index + i < 6) newOtp[index + i] = digit
            })
            setOtpCode(newOtp)
            const focusIndex = Math.min(index + digits.length, 5)
            otpInputs.current[focusIndex]?.focus()
            return
        }

        if (!/^\d*$/.test(value)) return

        const newOtp = [...otpCode]
        newOtp[index] = value
        setOtpCode(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpInputs.current[index - 1]?.focus()
        }
    }

    // Submit OTP
    const handleOtpSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const code = otpCode.join('')
        if (code.length !== 6) {
            setError('Please enter all 6 digits')
            return
        }

        setLoading(true)

        try {
            const result = await verifyLoginOTP(email, code, rememberDevice)
            // Update AuthContext with the user from the response
            if (result.user) {
                setUser(result.user)
            }
            toast.success('Welcome back! Login successful.')
            navigate('/dashboard')
        } catch (err) {
            const errorMsg = err.message || 'Invalid code'
            setError(errorMsg)
            toast.error(errorMsg)
            // Clear OTP inputs on error
            setOtpCode(['', '', '', '', '', ''])
            otpInputs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return

        try {
            await resendLoginOTP(email)
            setResendCooldown(60)
            toast.success('New code sent to your email')
            setOtpCode(['', '', '', '', '', ''])
            otpInputs.current[0]?.focus()
        } catch (err) {
            toast.error(err.message || 'Failed to resend code')
        }
    }

    // Go back to login form
    const handleBackToLogin = () => {
        setOtpStep(false)
        setOtpCode(['', '', '', '', '', ''])
        setError('')
    }

    // OTP Step UI
    if (otpStep) {
        return (
            <div className="min-h-screen flex">
                {/* Left Side - Same as login */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    <img src="/images/threpahy.jpg" alt="Therapy Session" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0E8499]/90 via-[#159DB3]/80 to-[#214B9D]/85"></div>
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>
                    <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                        <div>
                            <img src="/images/logo.png" alt="Data Sirena" className="h-20 w-auto mb-4" />
                            <p className="text-white/70 text-lg">Secure Verification</p>
                        </div>
                        <div className="max-w-md">
                            <div className="w-12 h-1 bg-white/30 rounded mb-6"></div>
                            <blockquote className="text-2xl font-heading font-medium leading-relaxed mb-4">
                                "Your security is our priority. Two-factor authentication protects your account."
                            </blockquote>
                        </div>
                        <div className="text-sm text-white/60">
                            &copy; {new Date().getFullYear()} Data Sirena
                        </div>
                    </div>
                </div>

                {/* Right Side - OTP Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
                    <div className="w-full max-w-md animate-fade-in">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <img src="/images/logo.png" alt="Data Sirena" className="h-12 w-auto mx-auto mb-2" />
                        </div>

                        <button onClick={handleBackToLogin} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                            <ArrowLeft size={16} className="mr-2" /> Back to login
                        </button>

                        {/* Header */}
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0E8499] to-[#159DB3] flex items-center justify-center mx-auto mb-4">
                                <Shield size={32} className="text-white" />
                            </div>
                            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                                Check your email
                            </h2>
                            <p className="text-gray-500">
                                We sent a 6-digit code to <br />
                                <span className="font-medium text-gray-900">{maskedEmail}</span>
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                {error}
                            </div>
                        )}

                        {/* OTP Form */}
                        <form onSubmit={handleOtpSubmit} className="space-y-6">
                            {/* 6-Digit Input */}
                            <div className="flex justify-center gap-2">
                                {otpCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpInputs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleOtpChange(index, e.target.value)}
                                        onKeyDown={e => handleOtpKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3] transition-all"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {/* Remember Device */}
                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={rememberDevice}
                                    onChange={e => setRememberDevice(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-[#159DB3] focus:ring-[#159DB3]"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">Remember this device</p>
                                    <p className="text-sm text-gray-500">Skip verification for 30 days</p>
                                </div>
                            </label>

                            {/* Submit */}
                            <Button type="submit" loading={loading} className="w-full py-4 text-base group">
                                {loading ? 'Verifying...' : (
                                    <>
                                        Verify & Sign In
                                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            {/* Resend */}
                            <div className="text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-gray-500">
                                        Resend code in <span className="font-medium">{resendCooldown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-sm text-[#159DB3] hover:underline flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <RefreshCw size={14} /> Resend code
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Normal Login Form
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img src="/images/threpahy.jpg" alt="Therapy Session" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E8499]/90 via-[#159DB3]/80 to-[#214B9D]/85"></div>
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <img src="/images/logo.png" alt="Data Sirena" className="h-20 w-auto mb-4" />
                        <p className="text-white/70 text-lg">Therapy Data Platform</p>
                    </div>
                    <div className="max-w-md">
                        <div className="w-12 h-1 bg-white/30 rounded mb-6"></div>
                        <blockquote className="text-2xl font-heading font-medium leading-relaxed mb-4">
                            "Empowering growth through data-driven care and meaningful progress tracking."
                        </blockquote>
                        <p className="text-white/60 text-sm">— Trusted by 500+ ABA therapists worldwide</p>
                    </div>
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
                        <p className="text-gray-500">Enter your credentials to access your dashboard</p>
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

                        {/* Turnstile CAPTCHA */}
                        <div className="flex justify-center my-4">
                            <Turnstile
                                key={turnstileKey}
                                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onVerify={(token) => setTurnstileToken(token)}
                                onExpire={() => setTurnstileToken('')}
                                theme="light"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={!turnstileToken}
                            className="w-full py-4 text-base group disabled:opacity-50 disabled:cursor-not-allowed"
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
