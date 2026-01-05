import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { mockSessions, mockClients } from '../data/mockData'
import { Calendar, Clock, ChevronRight, Plus, Search, User, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function SessionsPage() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = mockClients.find(c => c.id === clientId)
        return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
    }

    // Filter sessions
    const filteredSessions = mockSessions.filter(session => {
        const clientName = session.client_name || getClientName(session.client_id)
        return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.programs.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
    })

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="label-uppercase-light mb-2">S E S S I O N S</p>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                Session History
                            </h1>
                            <p className="text-white/70">
                                {mockSessions.length} sessions across all clients
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/sessions/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-[#1A8B73] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                        >
                            <Plus size={20} />
                            New Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by client or program..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1A8B73]/20 focus:border-[#1A8B73]"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="px-6 pb-8 max-w-screen-xl mx-auto">
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Calendar size={40} className="text-gray-300" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">No sessions found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search or start a new session.</p>
                        <Button icon={<Plus size={18} />} onClick={() => navigate('/sessions/new')}>
                            Start Session
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => navigate(`/sessions/${session.id}`)}
                                className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-lg hover:border-[#1A8B73]/20 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-[#E8F5F2] text-[#1A8B73] flex items-center justify-center flex-shrink-0">
                                            <User size={24} />
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <div className="flex items-center gap-3 text-gray-900 font-semibold mb-1">
                                                <span>{session.client_name || getClientName(session.client_id)}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${session.status === 'completed'
                                                        ? 'bg-[#E8F5F2] text-[#1A8B73]'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {format(new Date(session.start_time), 'MMMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {session.duration_minutes} min
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#1A8B73]">
                                                Programs: {session.programs.join(', ')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <FileText size={12} />
                                                {session.data_points} data points collected
                                            </p>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight size={24} className="text-gray-300 group-hover:text-[#1A8B73] transition-colors flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
