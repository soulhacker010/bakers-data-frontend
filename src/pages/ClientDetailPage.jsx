import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { mockClients, mockPrograms, mockSessions } from '../data/mockData'
import {
    Edit3,
    Plus,
    Play,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'

// Program Card with premium styling
function ProgramCard({ program, onStartSession, onViewProgress, onEdit }) {
    const isSkill = program.program_type === 'skill'
    const isTrial = program.data_type === 'trial'

    return (
        <div className="card-premium p-6 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <span className={`badge-pill mb-3 ${isSkill ? 'badge-skill' : 'badge-behavior'}`}>
                        {isSkill ? 'Skill Acquisition' : 'Behavior Reduction'}
                    </span>
                    <h3 className="font-heading text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {program.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-[#159DB3] hover:text-[#159DB3] transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onStartSession}
                        className="flex items-center gap-2 px-4 py-2 bg-[#159DB3] text-white rounded-xl text-sm font-semibold hover:bg-[#0E8499] transition-colors"
                    >
                        <Play size={16} />
                        Start Session
                    </button>
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {program.description}
            </p>

            {/* Progress/Trend */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    {isTrial ? (
                        <>
                            <span className="text-sm text-gray-500">Progress:</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${program.progress}%` }}
                                    ></div>
                                </div>
                                <span className="font-semibold text-gray-900 text-sm">{program.progress}%</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-sm text-gray-500">Trend:</span>
                            <span className={`font-semibold flex items-center gap-1 text-sm ${program.trend === 'decreasing' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {program.trend === 'decreasing' ? (
                                    <><TrendingDown size={16} /> Decreasing</>
                                ) : (
                                    <><TrendingUp size={16} /> Increasing</>
                                )}
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={onViewProgress}
                    className="text-primary font-medium text-sm flex items-center gap-1 hover:underline"
                >
                    View Graph
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    )
}

// Session History Card
function SessionCard({ session, onClick }) {
    return (
        <div
            onClick={onClick}
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

                <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium group-hover:border-[#159DB3] group-hover:text-[#159DB3] transition-colors">
                    View
                </button>
            </div>
        </div>
    )
}

import { ConfirmModal } from '../components/ui'
import { useToast } from '../context/ToastContext'

export default function ClientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState('programs')
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Find client
    const client = mockClients.find(c => c.id === parseInt(id)) || mockClients[0]

    // Get client's programs and sessions
    const clientPrograms = mockPrograms.filter(p => p.client_id === client.id)
    const clientSessions = mockSessions.filter(s => s.client_id === client.id)

    const handleStartSession = (programId) => {
        navigate(`/sessions/new/collect?client=${client.id}&program=${programId}`)
    }

    const handleDeleteClient = () => {
        // Mock delete - will connect to backend later
        console.log('Deleting client:', client.id)
        toast.success(`Client "${client.first_name} ${client.last_name}" deleted successfully`)
        navigate('/clients')
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    {/* Back link */}
                    <Link
                        to="/clients"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Clients
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="label-uppercase-light mb-2">C L I E N T &nbsp; P R O F I L E</p>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                {client.first_name} {client.last_name}, {client.age}
                            </h1>
                            <p className="text-white/70">
                                {client.diagnosis || 'No diagnosis specified'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/clients/${id}/edit`)}
                                className="btn-outline-premium bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                            >
                                <Edit3 size={18} />
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 border-2 border-red-400/50 text-red-200 rounded-xl font-medium hover:bg-red-500/20 hover:border-red-400 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
                <div className="max-w-screen-xl mx-auto px-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('programs')}
                            className={`py-4 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'programs'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Programs ({clientPrograms.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-4 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Session History ({clientSessions.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {activeTab === 'programs' ? (
                    <div className="space-y-4">
                        {clientPrograms.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">No programs yet. Create one to start tracking.</p>
                                <button
                                    onClick={() => navigate(`/clients/${client.id}/programs/new`)}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#159DB3] text-white rounded-xl font-semibold hover:bg-[#0E8499] transition-colors"
                                >
                                    <Plus size={18} />
                                    Add Program
                                </button>
                            </div>
                        ) : (
                            <>
                                {clientPrograms.map(program => (
                                    <ProgramCard
                                        key={program.id}
                                        program={program}
                                        onStartSession={() => handleStartSession(program.id)}
                                        onViewProgress={() => navigate(`/programs/${program.id}/progress`)}
                                        onEdit={() => navigate(`/programs/${program.id}/edit`)}
                                    />
                                ))}

                                {/* Add Program Button */}
                                <button
                                    onClick={() => navigate(`/clients/${client.id}/programs/new`)}
                                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add New Program
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {clientSessions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No sessions recorded yet.</p>
                            </div>
                        ) : (
                            clientSessions.map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    onClick={() => navigate(`/sessions/${session.id}`)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteClient}
                title="Delete Client?"
                message={`Are you sure you want to delete "${client.first_name} ${client.last_name}"? This will also delete all their programs and session data. This action cannot be undone.`}
                confirmText="Delete Client"
                type="danger"
            />
        </DashboardLayout>
    )
}
