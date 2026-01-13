import { Link } from 'react-router-dom'
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react'

/**
 * Registration Success Page
 * Shown after email verification - tells user their account is under review
 */
export default function RegistrationSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a2533] via-[#0d3040] to-[#0a2533] p-6">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#159DB3]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#214B9D]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Success Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="relative mx-auto mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        {/* Animated ring */}
                        <div className="absolute inset-0 rounded-2xl border-4 border-green-400/30 animate-ping"></div>
                    </div>

                    {/* Title */}
                    <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                        Registration Successful!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your email has been verified.
                    </p>

                    {/* Under Review Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold text-amber-800">Account Under Review</span>
                        </div>
                        <p className="text-sm text-amber-700">
                            Our admin team is reviewing your registration request.
                            You'll receive an email once your account is approved.
                        </p>
                    </div>

                    {/* What happens next */}
                    <div className="text-left bg-gray-50 rounded-2xl p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">What happens next?</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#159DB3]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-[#159DB3]">1</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Admin reviews your registration
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#159DB3]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Mail className="w-3 h-3 text-[#159DB3]" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    You receive an approval email
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Log in and start using the platform!
                                </p>
                            </li>
                        </ul>
                    </div>

                    {/* Action Button */}
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-[#159DB3] to-[#214B9D] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <p className="text-xs text-gray-400 mt-4">
                        You won't be able to log in until your account is approved.
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-white/50 mt-6">
                    Questions? Contact support@yourcompany.com
                </p>
            </div>
        </div>
    )
}
