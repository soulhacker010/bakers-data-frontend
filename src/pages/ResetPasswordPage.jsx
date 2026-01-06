import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { ArrowLeft, Eye, EyeOff, Check, Lock } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    // Password strength checks
    const hasLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const passwordsMatch = password === confirmPassword && password.length > 0

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
            toast.error('Password does not meet requirements')
            return
        }

        setLoading(true)

        try {
            // Mock API call - will connect to backend later
            console.log('Resetting password with token:', token)
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Password reset successfully! Please login with your new password.')
            navigate('/login')
        } catch (err) {
            toast.error('Failed to reset password. Please try again.')
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
                            Create New Password
                        </h2>
                        <p className="text-white/80 text-lg max-w-md mx-auto">
                            Choose a strong password to keep your account secure.
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

                    <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Enter your new password below.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div className="relative">
                            <Input
                                label="New Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock size={18} className="text-gray-400" />}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-10 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Requirements */}
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl">
                            <PasswordCheck met={hasLength} text="8+ characters" />
                            <PasswordCheck met={hasUpper} text="Uppercase" />
                            <PasswordCheck met={hasLower} text="Lowercase" />
                            <PasswordCheck met={hasNumber} text="Number" />
                        </div>

                        {/* Confirm Password */}
                        <Input
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            icon={<Lock size={18} className="text-gray-400" />}
                            error={confirmPassword && !passwordsMatch ? "Passwords don't match" : ''}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                            disabled={!passwordsMatch || !hasLength || !hasUpper || !hasLower || !hasNumber}
                        >
                            Reset Password
                        </Button>
                    </form>

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
