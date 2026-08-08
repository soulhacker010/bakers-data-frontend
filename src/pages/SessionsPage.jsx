import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Avatar } from '../components/ui'
import { getSessions, deleteSession } from '../services/sessions'
import { getClients } from '../services/clients'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, ChevronRight, Plus, Search, User, FileText, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedDate } from '../utils/datetime'
import { canSuperviseData } from '../utils/permissions'

export default function SessionsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    // Clearing a day is destructive, so it sits with supervision rather than
    // with coordinators. Mirrors app/core/roles.py on the server.
    const canCorrectData = canSuperviseData(user)
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState(null) // session id to delete

    // State for API data
    const [sessions, setSessions] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch data on mount
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [sessionsData, clientsData] = await Promise.all([
                getSessions(),
                getClients()
            ])
            setSessions(sessionsData)
            setClients(clientsData)
        } catch (err) {
            toast.error('Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId)
        return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
    }

    // Filter sessions by search
    const filteredSessions = sessions.filter(session => {
        const clientName = session.client_name || getClientName(session.client_id)
        return clientName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    // Clear a day's data. The visit record is kept and its data points are
    // flagged, so the day drops out of graphs and exports while remaining in
    // the audit trail.
    const handleDelete = async (sessionId) => {
        try {
            await deleteSession(sessionId)
            setSessions(prev => prev.map(s => (
                s.id === sessionId ? { ...s, data_points: 0 } : s
            )))
            toast.success("This day's data has been cleared")
            setDeleteConfirm(null)
        } catch (err) {
            toast.error(err.message || 'Failed to clear this session')
        }
    }

    return (
        <DashboardLayout>
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Clear this day's data?</h3>
                        <p className="text-gray-500 mb-6">
                            Everything recorded in this session will be removed from graphs, reports
                            and exports. The visit itself stays on the record and the change is
                            logged, so nothing is lost from the clinical history.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                {loading ? '...' : `${sessions.length} sessions across all clients`}
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/sessions/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-[#159DB3] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
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
                        placeholder="Search by client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="px-6 pb-12 max-w-screen-xl mx-auto">
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No sessions found</h3>
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
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#159DB3]/20 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className="flex items-start gap-4 flex-1 cursor-pointer"
                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                    >
                                        {/* Avatar */}
                                        <Avatar name={session.client_name || getClientName(session.client_id)} size={48} />

                                        {/* Content */}
                                        <div>
                                            <div className="flex items-center gap-3 text-gray-900 font-semibold mb-1">
                                                <span>{session.client_name || getClientName(session.client_id)}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${session.status === 'completed'
                                                    ? 'bg-[#E0F4F7] text-[#159DB3]'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    {format(toZonedDate(session.start_time), 'MMMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {session.duration_minutes || 0} min
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#159DB3]">
                                                {session.programs && session.programs.length > 0
                                                    ? `Programs: ${session.programs.map(p => typeof p === 'string' ? p : p.name).join(', ')}`
                                                    : 'No programs'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <FileText size={12} />
                                                {session.frequency_count !== null && session.frequency_count !== undefined
                                                    ? `${session.frequency_count} occurrences`
                                                    : `${session.data_points || 0} data points collected`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions - clearing a day's data is a BCBA/admin task */}
                                    <div className="flex items-center gap-2">
                                        {canCorrectData && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteConfirm(session.id)
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Clear this day's data"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <ChevronRight size={24} className="text-gray-300 group-hover:text-[#159DB3] transition-colors flex-shrink-0" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
