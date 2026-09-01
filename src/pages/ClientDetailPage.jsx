import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { getClient, deleteClient } from '../services/clients'
import { getPrograms, reorderPrograms, updateProgram } from '../services/programs'
import { getSessions } from '../services/sessions'
import { getMasteryProgress } from '../services/analytics'
import {
    Edit3,
    Plus,
    Play,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    ChevronRight,
    ArrowLeft,
    Users,
    Award,
    Target,
    Star,
    GripVertical,
    Archive,
    RotateCcw,
    BarChart2
} from 'lucide-react'
import { format } from 'date-fns'
import { toZonedDate } from '../utils/datetime'
import StaffAssignmentModal from '../components/staff/StaffAssignmentModal'
import WellnessPanel from '../components/wellness/WellnessPanel'

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
                    {program.status === 'maintenance' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 ml-2">
                            Maintenance
                        </span>
                    )}
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
                        {format(toZonedDate(session.start_time), 'MMMM d, yyyy')}
                        <span className="text-gray-300">•</span>
                        <Clock size={16} className="text-gray-400" />
                        {session.duration_minutes || 0} min
                    </div>
                    <p className="text-sm text-gray-500">
                        {session.programs && session.programs.length > 0
                            ? `Programs: ${session.programs.map(p => typeof p === 'string' ? p : p.name).join(', ')}`
                            : 'No programs'}
                    </p>
                    <p className="text-xs text-gray-400">
                        {session.data_points || 0} data points collected
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
import { useAuth } from '../context/AuthContext'
import { canManageStaffAssignments } from '../utils/permissions'

export default function ClientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('programs')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showStaffModal, setShowStaffModal] = useState(false)

    // State for data from API
    const [client, setClient] = useState(null)
    const [clientPrograms, setClientPrograms] = useState([])
    const [archivedPrograms, setArchivedPrograms] = useState([])
    const [clientSessions, setClientSessions] = useState([])
    const [masteryData, setMasteryData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [programTypeFilter, setProgramTypeFilter] = useState('all') // 'all', 'skill', 'behavior'
    const [draggedProgramId, setDraggedProgramId] = useState(null)

    // Fetch client data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [clientData, programsData, sessionsData, masteryRes] = await Promise.all([
                    getClient(id),
                    getPrograms({ client_id: id, includeInactive: true }),
                    getSessions({ client_id: id }),
                    getMasteryProgress(id).catch(() => null)
                ])
                setClient(clientData)
                // Split active vs. archived so the normal workflow only shows
                // active programs, while archived (mastered-out) ones remain
                // reachable under the Archived filter.
                setClientPrograms(programsData.filter(p => p.is_active !== false))
                setArchivedPrograms(programsData.filter(p => p.is_active === false))
                setClientSessions(sessionsData)
                setMasteryData(masteryRes)
            } catch (err) {
                toast.error(err.message || 'Failed to load client data')
                navigate('/clients')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, navigate, toast])

    const handleStartSession = (programId) => {
        navigate(`/sessions/new/collect?client=${client.id}&program=${programId}`)
    }

    // Restore an archived (inactive) program back to active. Moves it from the
    // Archived list into the active list locally so the change is immediate.
    const handleRestoreProgram = async (program) => {
        try {
            await updateProgram(program.id, { is_active: true, status: 'active' })
            toast.success(`"${program.name}" restored`)
            setArchivedPrograms(prev => prev.filter(p => p.id !== program.id))
            setClientPrograms(prev => [...prev, { ...program, is_active: true, status: 'active' }])
            setProgramTypeFilter('all')
        } catch (err) {
            toast.error(err.message || 'Failed to restore program')
        }
    }

    const handleDeleteClient = async () => {
        try {
            await deleteClient(id)
            toast.success(`Client "${client.first_name} ${client.last_name}" deleted successfully`)
            navigate('/clients')
        } catch (err) {
            toast.error(err.message || 'Failed to delete client')
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        )
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 text-center">
                    <p className="text-gray-500">Client not found</p>
                </div>
            </DashboardLayout>
        )
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
                            {/* Assigning staff is refused for the staff role, so
                                offering the control only produced an error the
                                team then reported as a bug (Dr Joe, 1 Sept 2026).
                                The server still checks; this only stops us asking. */}
                            {canManageStaffAssignments(user) && (
                                <button
                                    onClick={() => setShowStaffModal(true)}
                                    className="btn-outline-premium bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                                >
                                    <Users size={18} />
                                    Staff Access
                                </button>
                            )}
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
                            onClick={() => setActiveTab('mastery')}
                            className={`py-4 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'mastery'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Award size={16} />
                            Mastery Progress
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
                        <button
                            onClick={() => setActiveTab('wellness')}
                            className={`py-4 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'wellness'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Wellness
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {activeTab === 'programs' && (
                    <div className="space-y-4">
                        {clientPrograms.length === 0 && archivedPrograms.length === 0 ? (
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
                                {/* Every graph for this learner on one page, so a
                                    BCBA reviewing progress does not have to open
                                    each program in turn (requested by the clinical
                                    team, Aug 2026). */}
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => navigate(`/clients/${client.id}/graphs`)}
                                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#159DB3] text-[#159DB3] rounded-xl font-semibold hover:bg-[#E0F4F7] transition-colors text-sm"
                                    >
                                        <BarChart2 size={16} />
                                        View All Graphs
                                    </button>
                                </div>

                                {/* Program Type Filter Tabs */}
                                <div className="flex items-center gap-2 mb-4">
                                    {[{ key: 'all', label: 'All Programs' },
                                      { key: 'behavior', label: 'Behavior Reduction' },
                                      { key: 'skill', label: 'Skill Acquisition' }].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setProgramTypeFilter(tab.key)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${programTypeFilter === tab.key
                                                ? 'bg-[#159DB3] text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {tab.label} ({tab.key === 'all'
                                                ? clientPrograms.length
                                                : clientPrograms.filter(p => p.program_type === tab.key).length})
                                        </button>
                                    ))}
                                    {archivedPrograms.length > 0 && (
                                        <button
                                            onClick={() => setProgramTypeFilter('archived')}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${programTypeFilter === 'archived'
                                                ? 'bg-gray-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Archive size={15} />
                                            Archived / Mastered ({archivedPrograms.length})
                                        </button>
                                    )}
                                </div>

                                {/* Archived programs — mastered-out / inactive programs kept
                                    reachable so their data and graphs aren't lost. */}
                                {programTypeFilter === 'archived' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500">
                                            These programs were archived (for example, mastered out). Their data and graphs are kept — open a graph to review it, or restore a program to make it active again.
                                        </p>
                                        {archivedPrograms.map(program => (
                                            <div key={program.id} className="card-premium p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className={`badge-pill ${program.program_type === 'skill' ? 'badge-skill' : 'badge-behavior'}`}>
                                                            {program.program_type === 'skill' ? 'Skill Acquisition' : 'Behavior Reduction'}
                                                        </span>
                                                        {program.status === 'mastered' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-green-100 text-green-700">
                                                                <Star size={12} /> Mastered
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
                                                                <Archive size={12} /> Archived
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-heading text-lg font-bold text-gray-900 truncate">{program.name}</h3>
                                                    {program.description && (
                                                        <p className="text-gray-500 text-sm mt-1 line-clamp-1">{program.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => navigate(`/programs/${program.id}/progress`)}
                                                        className="flex items-center gap-1 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-[#159DB3] hover:text-[#159DB3] transition-colors"
                                                    >
                                                        <ChevronRight size={14} /> View Graph
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreProgram(program)}
                                                        className="flex items-center gap-1 px-4 py-2 bg-[#159DB3] text-white rounded-xl text-sm font-semibold hover:bg-[#0E8499] transition-colors"
                                                    >
                                                        <RotateCcw size={14} /> Restore
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Programs List with Drag Reorder */}
                                {clientPrograms
                                    .filter(p => programTypeFilter === 'all' || p.program_type === programTypeFilter)
                                    .map(program => (
                                    <div
                                        key={program.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDraggedProgramId(program.id)
                                            e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.dataTransfer.dropEffect = 'move'
                                        }}
                                        onDrop={async (e) => {
                                            e.preventDefault()
                                            if (draggedProgramId === program.id) return
                                            
                                            // Reorder in state
                                            const filtered = programTypeFilter === 'all'
                                                ? [...clientPrograms]
                                                : [...clientPrograms]
                                            const fromIndex = filtered.findIndex(p => p.id === draggedProgramId)
                                            const toIndex = filtered.findIndex(p => p.id === program.id)
                                            if (fromIndex === -1 || toIndex === -1) return
                                            
                                            const reordered = [...clientPrograms]
                                            const [moved] = reordered.splice(fromIndex, 1)
                                            reordered.splice(toIndex, 0, moved)
                                            setClientPrograms(reordered)
                                            setDraggedProgramId(null)
                                            
                                            // Persist to server
                                            try {
                                                await reorderPrograms(client.id, reordered.map(p => p.id))
                                            } catch (err) {
                                                console.error('Failed to reorder:', err)
                                            }
                                        }}
                                        onDragEnd={() => setDraggedProgramId(null)}
                                        className={`flex items-start gap-3 transition-all ${draggedProgramId === program.id ? 'opacity-50' : ''}`}
                                    >
                                        {/* Drag Handle */}
                                        <div className="pt-6 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <ProgramCard
                                                program={program}
                                                onStartSession={() => handleStartSession(program.id)}
                                                onViewProgress={() => navigate(`/programs/${program.id}/progress`)}
                                                onEdit={() => navigate(`/programs/${program.id}/edit`)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Add Program Button */}
                                {programTypeFilter !== 'archived' && (
                                    <button
                                        onClick={() => navigate(`/clients/${client.id}/programs/new`)}
                                        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Add New Program
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'mastery' && (
                    <div className="space-y-4">
                        {!masteryData || masteryData.programs?.length === 0 ? (
                            <div className="text-center py-12">
                                <Award size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">No mastery data available yet.</p>
                                <p className="text-gray-400 text-sm">Complete some sessions to see progress.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {masteryData.programs.map(program => (
                                    <div key={program.program_id} className="card-premium p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className={`badge-pill mb-2 ${program.program_type === 'skill' ? 'badge-skill' : 'badge-behavior'}`}>
                                                    {program.program_type === 'skill' ? 'Skill' : 'Behavior'}
                                                </span>
                                                <h3 className="font-heading text-xl font-bold text-gray-900">
                                                    {program.program_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Mastery: {program.mastery_criteria}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {program.status === 'mastered' && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                                        <Star size={14} fill="currentColor" />
                                                        MASTERED
                                                    </span>
                                                )}
                                                {program.status === 'almost_there' && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                                        🔥 Almost There!
                                                    </span>
                                                )}
                                                {program.status === 'progressing' && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                                        <TrendingUp size={14} />
                                                        Progressing
                                                    </span>
                                                )}
                                                {program.status === 'in_progress' && (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                                                        In Progress
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600">Progress to Mastery</span>
                                                <span className="font-semibold text-gray-900">
                                                    {program.current_accuracy}% / {program.mastery_target}%
                                                </span>
                                            </div>
                                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${program.status === 'mastered' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                                        program.status === 'almost_there' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                                            'bg-gradient-to-r from-[#159DB3] to-[#0D7C8C]'
                                                        }`}
                                                    style={{ width: `${Math.min(100, program.mastery_progress)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Target size={14} />
                                                {program.sessions_counted} sessions analyzed
                                            </span>
                                            <span>
                                                {program.total_data_points} data points
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
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

                {activeTab === 'wellness' && (
                    <WellnessPanel
                        clientId={client.id}
                        clientName={`${client.first_name} ${client.last_name}`}
                    />
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

            {/* Staff Assignment Modal */}
            {showStaffModal && (
                <StaffAssignmentModal
                    onClose={() => setShowStaffModal(false)}
                    clientId={client.id}
                    clientName={`${client.first_name} ${client.last_name}`}
                />
            )}
        </DashboardLayout>
    )
}
