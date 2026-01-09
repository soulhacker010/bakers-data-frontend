import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

/**
 * Verify Code Page
 * 6-digit code verification with auto-submit
 */
export default function VerifyCodePage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { setUser } = useAuth()
    const { toast } = useToast()

    const email = searchParams.get('email') || ''

    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)

    const inputRefs = useRef([])

    // Start with 60s cooldown (just registered)
    useEffect(() => {
        setResendCooldown(60)
    }, [])

    // Countdown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    // Auto-focus first input
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)
        setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5) {
            const fullCode = newCode.join('')
            if (fullCode.length === 6) {
                handleVerify(fullCode)
            }
        }
    }

    const handleKeyDown = (index, e) => {
        // Backspace - go to previous input
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        // Arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pastedData.length === 6) {
            const newCode = pastedData.split('')
            setCode(newCode)
            handleVerify(pastedData)
        }
    }

    const handleVerify = async (fullCode) => {
        setLoading(true)
        setError('')

        try {
            const response = await api.post('/api/auth/verify-code', {
                email,
                code: fullCode
            })

            // Success - redirect to login
            toast.success('Email verified successfully! Please log in.')
            navigate('/login')
        } catch (err) {
            let errorMsg = err.response?.data?.detail || 'Verification failed. Please try again.'

            // Make error messages more user-friendly
            if (errorMsg.includes('not found') || errorMsg.includes('No verification code')) {
                errorMsg = 'No verification code found for this email. Please request a new code.'
            } else if (errorMsg.includes('Invalid email')) {
                errorMsg = 'Invalid verification code. Please check and try again.'
            } else if (errorMsg.includes('expired')) {
                errorMsg = 'This code has expired. Please request a new one.'
            } else if (errorMsg.includes('Too many')) {
                errorMsg = 'Too many attempts. Please request a new code.'
            }

            setError(errorMsg)
            toast.error(errorMsg)

            // Clear code on error
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return

        try {
            await api.post('/api/auth/resend-code', { email })
            toast.success('New code sent! Check your email.')
            setResendCooldown(60)
            setError('')
            setCode(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to resend code'
            toast.error(errorMsg)
        }
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Missing Email</h1>
                    <p className="text-gray-600 mb-6">No email provided for verification.</p>
                    <Link to="/register" className="text-primary hover:underline">
                        Go to Registration
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in relative overflow-hidden">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0E8499] to-[#159DB3]"></div>

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <img src="/images/logo.png" alt="Data Sirena" className="h-16 w-auto mx-auto mb-4" />
                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                        Verify your email
                    </h2>
                    <p className="text-gray-500 text-sm">
                        We sent a 6-digit code to<br />
                        <span className="font-medium text-gray-700">{email}</span>
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2 animate-shake">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {error}
                    </div>
                )}

                {/* Code Input */}
                <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                                ${digit
                                    ? 'border-[#0E8499] text-[#0E8499] bg-[#0E8499]/5 shadow-sm'
                                    : 'border-gray-200 text-gray-500 focus:border-[#0E8499] focus:ring-4 focus:ring-[#0E8499]/10'
                                }
                                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            disabled={loading}
                        />
                    ))}
                </div>

                {/* Resend & Actions */}
                <div className="text-center space-y-6">
                    <div className="text-sm">
                        <p className="text-gray-500 mb-1">Didn't receive the code?</p>
                        {resendCooldown > 0 ? (
                            <span className="text-[#0E8499] font-medium font-mono">
                                Resend in {resendCooldown}s
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-[#0E8499] font-medium hover:text-[#0b6b7d] hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E8499]/20 rounded px-2"
                            >
                                Resend Code
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors text-sm"
                        >
                            <span>&larr;</span>
                            <span className="ml-2">Back to Login</span>
                        </Link>
                    </div>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-[#0E8499] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[#0E8499] font-medium text-sm animate-pulse">Verifying...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
