import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import {
    ArrowRight,
    Users,
    FileText,
    Play,
    Target,
    BarChart3,
    Settings,
    CheckCircle,
    ChevronRight
} from 'lucide-react'

const steps = [
    {
        number: 1,
        title: 'Add Your First Client',
        description: 'Start by adding a client to the system. You\'ll need their name and date of birth.',
        icon: Users,
        link: '/clients/new',
        linkText: 'Add Client'
    },
    {
        number: 2,
        title: 'Create a Program',
        description: 'Programs define the skills or behaviors you\'re tracking. Choose a data type that matches how you\'ll measure progress.',
        icon: FileText,
        link: '/programs/new',
        linkText: 'Create Program',
        tips: [
            'Trial-based: For discrete trials (correct/incorrect)',
            'Frequency: For counting occurrences',
            'Duration: For timing how long something lasts',
            'Task Analysis: For multi-step skills'
        ]
    },
    {
        number: 3,
        title: 'Add Targets',
        description: 'Targets are the specific skills within a program. Set mastery criteria for each target.',
        icon: Target,
        tips: [
            'Default mastery: 80% accuracy over 3 sessions',
            'Customize in Settings > Therapy Defaults'
        ]
    },
    {
        number: 4,
        title: 'Start a Session',
        description: 'Begin collecting data! Select a client and program, then use the large buttons to record responses.',
        icon: Play,
        link: '/sessions/new',
        linkText: 'Start Session',
        tips: [
            'Data saves automatically as you record',
            'Switch between programs during a session',
            'Add notes at the end of each session'
        ]
    },
    {
        number: 5,
        title: 'Track Progress',
        description: 'View graphs and reports to monitor client progress over time. Celebrate when targets are mastered!',
        icon: BarChart3,
        link: '/reports',
        linkText: 'View Reports'
    },
    {
        number: 6,
        title: 'Customize Settings',
        description: 'Configure your preferences for session defaults, notifications, and data export.',
        icon: Settings,
        link: '/settings',
        linkText: 'Open Settings'
    }
]

function StepCard({ step }) {
    const Icon = step.icon

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
            {/* Step Number Badge */}
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-[#159DB3] to-[#1A3A4F] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {step.number}
            </div>

            <div className="flex items-start gap-4 pt-2">
                <div className="w-12 h-12 bg-[#E0F4F7] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={24} className="text-[#159DB3]" />
                </div>
                <div className="flex-1">
                    <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {step.description}
                    </p>

                    {step.tips && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">💡 Tips:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                {step.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {step.link && (
                        <Link
                            to={step.link}
                            className="inline-flex items-center gap-2 text-[#159DB3] font-semibold hover:underline"
                        >
                            {step.linkText}
                            <ChevronRight size={16} />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function GettingStartedPage() {
    return (
        <DashboardLayout>
            <div className="px-6 py-8 max-w-screen-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-[#E0F4F7] text-[#159DB3] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Play size={16} />
                        Getting Started
                    </div>
                    <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">
                        Welcome to Data Sirena
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Follow these steps to set up your account and start collecting behavioral data for your clients.
                    </p>
                </div>

                {/* Quick Start Banner */}
                <div className="bg-gradient-to-r from-[#1A3A4F] to-[#159DB3] rounded-2xl p-6 mb-10 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-heading text-xl font-bold mb-1">Ready to start right away?</h2>
                            <p className="text-white/80">Jump straight into a data collection session</p>
                        </div>
                        <Link
                            to="/sessions/new"
                            className="bg-white text-[#159DB3] px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            Start Session
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-8">
                    {steps.map((step) => (
                        <StepCard key={step.number} step={step} />
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-12 text-center">
                    <div className="bg-gray-50 rounded-2xl p-8">
                        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-3">
                            Need more help?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Check out our documentation for detailed guides on every feature.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link
                                to="/docs"
                                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#159DB3] hover:text-[#159DB3] transition-colors"
                            >
                                View Documentation
                            </Link>
                            <Link
                                to="/support"
                                className="px-6 py-3 bg-gradient-to-r from-[#159DB3] to-[#1A3A4F] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
