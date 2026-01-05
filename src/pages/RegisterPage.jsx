import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input, Select } from '../components/ui'
import { Eye, EyeOff, Check } from 'lucide-react'

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
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { register } = useAuth()
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
            return
        }

        if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
            setError('Password does not meet requirements')
            return
        }

        setLoading(true)

        try {
            await register(fullName, email, password)
            navigate('/dashboard')
        } catch (err) {
            setError('Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const PasswordCheck = ({ met, text }) => (
        <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-100' : 'bg-gray-100'}`}>
                {met && <Check size={10} />}
            </div>
            {text}
        </div>
    )

    return (
        <div className="min-h-screen hero-gradient flex items-center justify-center p-6">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Register Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-3xl font-bold text-primary mb-2">
                            ABA Collect
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Start your journey today
                        </p>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-8">
                        <p className="label-uppercase mb-2">G E T &nbsp; S T A R T E D</p>
                        <h2 className="font-heading text-2xl font-bold text-gray-900">
                            Create your account
                        </h2>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            minLength={2}
                        />

                        {/* Email */}
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        {/* Role/Certification */}
                        <Select
                            label="Role / Certification"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            options={roleOptions}
                            placeholder="Select your role..."
                            required
                        />

                        {/* Password */}
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                        {/* Confirm Password */}
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full py-4 text-base mt-6"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-white/60 text-xs mt-6">
                    © 2024 ABA Collect. All rights reserved.
                </p>
            </div>
        </div>
    )
}
