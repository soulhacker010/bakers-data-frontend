import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { mockSessions } from '../data/mockData'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function SessionsPage() {
    const navigate = useNavigate()

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <p className="label-uppercase-light mb-2">S E S S I O N S</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                        Session History
                    </h1>
                    <p className="text-white/70">
                        View all therapy sessions across all clients
                    </p>
                </div>
            </div>

            {/* Sessions List */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="space-y-4">
                    {mockSessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            className="card-premium p-5 cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-gray-900 font-medium">
                                        <Calendar size={16} className="text-gray-400" />
                                        {format(new Date(session.start_time), 'MMMM d, yyyy')}
                                        <span className="text-gray-300">•</span>
                                        <Clock size={16} className="text-gray-400" />
                                        {session.duration_minutes} min
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Programs: {session.programs.join(', ')}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {session.data_points} data points collected
                                    </p>
                                </div>

                                <ChevronRight size={20} className="text-gray-400 group-hover:text-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
