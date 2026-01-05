import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { mockSessions } from '../data/mockData'
import { ArrowLeft, Calendar, Clock, FileText, Play } from 'lucide-react'
import { format } from 'date-fns'

export default function SessionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // Get session from mock data
    const session = mockSessions.find(s => s.id === parseInt(id))

    if (!session) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 text-center">
                    <p className="text-gray-500">Session not found</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="hero-gradient px-6 py-8">
                <div className="max-w-screen-xl mx-auto">
                    <button
                        onClick={() => navigate('/sessions')}
                        className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Sessions
                    </button>
                    <p className="label-uppercase-light mb-2">S E S S I O N &nbsp; D E T A I L S</p>
                    <h1 className="font-heading text-3xl font-bold text-white">
                        {session.client_name}
                    </h1>
                    <p className="text-white/70 mt-2">
                        {format(new Date(session.start_time), 'MMMM d, yyyy')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Session Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card-premium p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Session Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <Calendar size={24} className="mx-auto text-primary mb-2" />
                                    <p className="text-xs text-gray-500 uppercase">Date</p>
                                    <p className="font-semibold text-gray-900">
                                        {format(new Date(session.start_time), 'MMM d')}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <Clock size={24} className="mx-auto text-primary mb-2" />
                                    <p className="text-xs text-gray-500 uppercase">Duration</p>
                                    <p className="font-semibold text-gray-900">{session.duration_minutes} min</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <FileText size={24} className="mx-auto text-primary mb-2" />
                                    <p className="text-xs text-gray-500 uppercase">Data Points</p>
                                    <p className="font-semibold text-gray-900">{session.data_points}</p>
                                </div>
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Programs Worked On</h3>
                            <div className="space-y-3">
                                {session.programs.map((program, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <span className="font-medium text-gray-900">{program}</span>
                                        <button className="text-sm text-primary font-medium hover:underline">
                                            View Progress
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card-premium p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Session Notes</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {session.notes || 'No notes recorded for this session.'}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="card-premium p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/sessions/${id}/collect`)}
                                    className="w-full btn-primary-premium flex items-center justify-center gap-2"
                                >
                                    <Play size={18} />
                                    Continue Session
                                </button>
                                <button className="w-full btn-outline-premium">
                                    Export Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
