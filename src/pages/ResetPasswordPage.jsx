import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword, validateCode } from '../services/auth'
import { useToast } from '../context/ToastContext'
import { Button, Input } from '../components/ui'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [showPass, setShowPass] = useState(false)

    // UI States
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [error, setError] = useState('')
    const [codeError, setCodeError] = useState('')

    useEffect(() => {
        const emailParam = searchParams.get('email')
        if (emailParam) setEmail(emailParam)
    }, [searchParams])

    // Auto-verify code when 6 digits entered
    useEffect(() => {
        const verify = async () => {
            if (code.length === 6) {
                setVerifying(true)
                setCodeError('')
                setError('')
                try {
                    await validateCode(email, code)
                    setIsVerified(true)
                    // toast.success("Code verified!") // Optional: User sees Green Check
                } catch (err) {
                    setIsVerified(false)
                    setCodeError('Invalid code')
                    // toast.error("Invalid code")
                } finally {
                    setVerifying(false)
                }
            } else {
                setIsVerified(false)
                setCodeError('')
            }
        }

        // Debounce slightly or just run? Run immediately on 6th digit.
        const timer = setTimeout(() => {
            if (code.length === 6 && email) verify()
        }, 500) // Small delay to prevent spam while typing fast? 

        return () => clearTimeout(timer)
    }, [code, email])


    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!isVerified) {
            setError('Please enter a valid code first.')
            return
        }

        if (newPass !== confirmPass) {
            setError('Passwords do not match')
            return
        }

        if (newPass.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            await resetPassword(email, code, newPass)
            toast.success('Password updated successfully! Please log in.')
            navigate('/login')
        } catch (err) {
            // api.js interceptor throws Error(detail), so err.message contains the backend text
            const msg = err.message || err.response?.data?.detail || 'Invalid code or expired.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img
                    src="/images/threpahy.jpg"
                    alt="Therapy"
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
                        <p className="text-white/70 text-lg">New Credentials</p>
                    </div>
                    <div className="max-w-md">
                        <blockquote className="text-2xl font-heading font-medium leading-relaxed mb-4">
                            "Security is our priority. Let's get you a new fresh start."
                        </blockquote>
                    </div>
                    <div className="text-sm text-white/60">
                        &copy; {new Date().getFullYear()} Data Sirena
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="mb-8">
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                            Reset Password
                        </h2>
                        <p className="text-gray-500">
                            Enter the code sent to your email and choose a new password.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        // Disabled if verified to lock it in? (Optional)
                        />

                        <div className="space-y-1 relative">
                            <label className="label-uppercase block">Verification Code</label>
                            <div className="relative">
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className={`tracking-widest font-mono text-center text-lg pr-12 transition-colors ${isVerified ? 'border-green-500 bg-green-50 focus:ring-green-200' :
                                        codeError ? 'border-red-500 bg-red-50 focus:ring-red-200' : ''
                                        }`}
                                    maxLength={6}
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {verifying ? (
                                        <Loader2 className="animate-spin text-primary" size={20} />
                                    ) : isVerified ? (
                                        <Check className="text-green-600" size={24} strokeWidth={3} />
                                    ) : code.length === 6 && codeError ? (
                                        <X className="text-red-500" size={24} strokeWidth={3} />
                                    ) : null}
                                </div>
                            </div>
                            {isVerified && <p className="text-xs text-green-600 font-medium">Code verified successfully!</p>}
                            {codeError && <p className="text-xs text-red-600 font-medium">{codeError}</p>}
                        </div>

                        {/* Transition wrapper for password fields */}
                        <div className={`space-y-5 transition-all duration-300 ${!isVerified ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <div>
                                <label className="label-uppercase block mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={newPass}
                                        onChange={(e) => setNewPass(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-premium pr-12"
                                        required
                                        minLength={6}
                                        disabled={!isVerified}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={!isVerified}
                                    >
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label-uppercase block mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-premium"
                                    required
                                    disabled={!isVerified}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className={`w-full py-4 text-base group transition-all duration-300 ${!isVerified ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                            disabled={!isVerified || loading}
                        >
                            {loading ? 'Updating...' : (
                                <>
                                    Update Password
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link to="/login" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">
                            Wait, I remember my password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
