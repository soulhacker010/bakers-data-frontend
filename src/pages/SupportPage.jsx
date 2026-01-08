import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import {
    HelpCircle,
    MessageCircle,
    Mail,
    Book,
    FileText,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Phone,
    Clock,
    Play
} from 'lucide-react'

const faqs = [
    {
        question: 'How do I start a new data collection session?',
        answer: 'Navigate to Sessions > New Session, select a client and program, then click "Start Session" to begin collecting data. You can record trials, frequency counts, or duration data depending on your program type.'
    },
    {
        question: 'How do I add a new client?',
        answer: 'Go to Clients > Add Client, fill in the client\'s name, date of birth, and any relevant notes. Once added, you can create programs and targets for that client.'
    },
    {
        question: 'What do the different data types mean?',
        answer: 'Trial-based: Record correct/incorrect responses. Frequency: Count occurrences of a behavior. Duration: Measure how long a behavior lasts. Task Analysis: Track completion of multi-step tasks.'
    },
    {
        question: 'How is mastery determined?',
        answer: 'Mastery is based on your configured criteria in Settings > Therapy Defaults. By default, a target is considered mastered when the client achieves 80% accuracy across 3 consecutive sessions.'
    },
    {
        question: 'Can I export my data?',
        answer: 'Yes! Go to Settings > Data & Export > Export All Data to download all your client data, programs, sessions, and data points as a JSON file for backup or analysis.'
    },
    {
        question: 'How do I edit or delete recorded data?',
        answer: 'Open the session detail page and click on any data point to view options. You can remove incorrectly recorded data points. Note: Data is soft-deleted for compliance purposes.'
    },
    {
        question: 'What happens if I close the browser during a session?',
        answer: 'Your session data is saved to the server in real-time as you record. If you close the browser, you can continue the session from the Sessions page - look for sessions without an end time.'
    },
    {
        question: 'Is my data secure and HIPAA compliant?',
        answer: 'Yes. All data is encrypted, sessions auto-logout after 15 minutes of inactivity, and we maintain audit logs of all data access for compliance purposes.'
    }
]

const resources = [
    {
        title: 'Getting Started Guide',
        description: 'Learn the basics of Data Sirena',
        icon: Play,
        href: '/getting-started'
    },
    {
        title: 'Video Tutorials',
        description: 'Watch step-by-step tutorials',
        icon: ExternalLink,
        href: '#',
        external: true
    },
    {
        title: 'Documentation',
        description: 'Detailed feature documentation',
        icon: FileText,
        href: '/docs'
    }
]

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900">{question}</span>
                {isOpen ? (
                    <ChevronUp size={20} className="text-gray-400 flex-shrink-0 ml-4" />
                ) : (
                    <ChevronDown size={20} className="text-gray-400 flex-shrink-0 ml-4" />
                )}
            </button>
            {isOpen && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    )
}

export default function SupportPage() {
    const [contactForm, setContactForm] = useState({
        subject: '',
        message: ''
    })
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        // In production, this would send to your support system
        console.log('Support request:', contactForm)
        setSubmitted(true)
        setTimeout(() => {
            setContactForm({ subject: '', message: '' })
            setSubmitted(false)
        }, 3000)
    }

    return (
        <DashboardLayout>
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#159DB3] to-[#1A3A4F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <HelpCircle size={32} className="text-white" />
                    </div>
                    <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">
                        Help & Support
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Find answers to common questions, access resources, or get in touch with our support team.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - FAQs */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* FAQs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <MessageCircle size={24} className="text-[#159DB3]" />
                                Frequently Asked Questions
                            </h2>
                            <div className="space-y-3">
                                {faqs.map((faq, index) => (
                                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>
                        </div>

                        {/* Resources */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Book size={24} className="text-[#159DB3]" />
                                Resources
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {resources.map((resource, index) => {
                                    const content = (
                                        <>
                                            <resource.icon size={24} className="text-[#159DB3] mb-3" />
                                            <h3 className="font-semibold text-gray-900 group-hover:text-[#159DB3] transition-colors">
                                                {resource.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                                        </>
                                    )

                                    return resource.external ? (
                                        <a
                                            key={index}
                                            href={resource.href}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-[#159DB3] hover:bg-[#E0F4F7]/30 transition-all group"
                                        >
                                            {content}
                                        </a>
                                    ) : (
                                        <Link
                                            key={index}
                                            to={resource.href}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-[#159DB3] hover:bg-[#E0F4F7]/30 transition-all group"
                                        >
                                            {content}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Contact */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Mail size={24} className="text-[#159DB3]" />
                                Contact Us
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <Mail size={18} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <a href="mailto:support@datasirena.com" className="text-[#159DB3] hover:underline">
                                            support@datasirena.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone size={18} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <span className="text-gray-900">+1 (555) 123-4567</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock size={18} className="text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Support Hours</p>
                                        <span className="text-gray-900">Mon-Fri, 9AM-6PM EST</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Send us a message</h3>

                                {submitted ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                        <p className="text-green-700 font-medium">Message sent!</p>
                                        <p className="text-green-600 text-sm mt-1">We'll get back to you soon.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="label-uppercase block mb-2">Subject</label>
                                            <input
                                                type="text"
                                                value={contactForm.subject}
                                                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                                placeholder="How can we help?"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#159DB3] focus:ring-4 focus:ring-[#159DB3]/10"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label-uppercase block mb-2">Message</label>
                                            <textarea
                                                value={contactForm.message}
                                                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                                placeholder="Describe your issue or question..."
                                                rows={4}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#159DB3] focus:ring-4 focus:ring-[#159DB3]/10"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-gradient-to-r from-[#159DB3] to-[#1A3A4F] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                                        >
                                            Send Message
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-gradient-to-br from-[#E0F4F7] to-white rounded-2xl border border-[#159DB3]/20 p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">💡 Quick Tips</h3>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li>• Use keyboard shortcuts: <kbd className="px-2 py-0.5 bg-white rounded text-xs font-mono">Space</kbd> for correct, <kbd className="px-2 py-0.5 bg-white rounded text-xs font-mono">X</kbd> for incorrect</li>
                                <li>• Export data regularly for backups</li>
                                <li>• Set up therapy defaults to save time</li>
                                <li>• Check Progress graphs for trends</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
