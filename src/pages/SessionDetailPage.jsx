import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { mockSessions } from '../data/mockData'
import { ArrowLeft, Calendar, Clock, FileText, Play, Download, Target, Activity, BarChart2, User } from 'lucide-react'
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
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <FileText size={40} className="text-gray-300" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Session not found</h3>
                    <p className="text-gray-500 mb-6">This session may have been deleted or doesn't exist.</p>
                    <Button onClick={() => navigate('/sessions')}>
                        Back to Sessions
                    </Button>
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
                        className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        Back to Sessions
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <p className="label-uppercase-light mb-2">S E S S I O N &nbsp; D E T A I L S</p>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <User size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="font-heading text-3xl font-bold text-white">
                                        {session.client_name}
                                    </h1>
                                    <p className="text-white/70">
                                        {format(new Date(session.start_time), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${session.status === 'completed'
                            ? 'bg-white/20 text-white'
                            : 'bg-yellow-400 text-yellow-900'
                            }`}>
                            {session.status === 'completed' ? '✓ Completed' : '◐ In Progress'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Session Summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Session Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-5 bg-[#E8F5F2] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#1A8B73]/20 flex items-center justify-center mx-auto mb-3">
                                        <Calendar size={20} className="text-[#1A8B73]" />
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</p>
                                    <p className="font-heading font-bold text-gray-900 text-lg">
                                        {format(new Date(session.start_time), 'MMM d')}
                                    </p>
                                </div>
                                <div className="text-center p-5 bg-blue-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                        <Clock size={20} className="text-blue-600" />
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                                    <p className="font-heading font-bold text-gray-900 text-lg">{session.duration_minutes} min</p>
                                </div>
                                <div className="text-center p-5 bg-[#E8F5F2] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#1A8B73]/20 flex items-center justify-center mx-auto mb-3">
                                        <FileText size={20} className="text-[#1A8B73]" />
                                    </div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Points</p>
                                    <p className="font-heading font-bold text-gray-900 text-lg">{session.data_points}</p>
                                </div>
                            </div>
                        </div>

                        {/* Programs Worked On */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Programs Worked On</h3>
                            <div className="space-y-3">
                                {session.programs.map((program, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-[#E8F5F2] transition-colors group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 group-hover:text-[#1A8B73] transition-colors">
                                                    {program}
                                                </span>
                                                <p className="text-xs text-gray-500">Skill Acquisition</p>
                                            </div>
                                        </div>
                                        <button className="flex items-center gap-2 text-sm text-[#1A8B73] font-medium hover:underline">
                                            <BarChart2 size={16} />
                                            View Progress
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Session Notes */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Session Notes</h3>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-600 leading-relaxed">
                                    {session.notes || 'No notes recorded for this session.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/sessions/${id}/collect`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A8B73] text-white font-semibold rounded-xl hover:bg-[#156B59] transition-colors shadow-md"
                                >
                                    <Play size={18} />
                                    Continue Session
                                </button>
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#1A8B73] hover:text-[#1A8B73] transition-colors">
                                    <Download size={18} />
                                    Export Data
                                </button>
                            </div>
                        </div>

                        {/* Session Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Session Info</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Session ID</span>
                                    <span className="font-mono text-sm text-gray-900">#{session.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Start Time</span>
                                    <span className="text-gray-900">{format(new Date(session.start_time), 'h:mm a')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`font-medium ${session.status === 'completed' ? 'text-[#1A8B73]' : 'text-yellow-600'}`}>
                                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
