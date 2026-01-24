import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Avatar } from '../components/ui'
import { getSession } from '../services/sessions'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Calendar, Clock, FileText, Play, Download, Target, Activity, BarChart2, User, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { deleteSessionData } from '../services/sessions'

export default function SessionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null) // Track which item is being deleted
    const [deleteConfirmId, setDeleteConfirmId] = useState(null) // For delete confirmation modal

    // Fetch session data
    useEffect(() => {
        const fetchSession = async () => {
            try {
                setLoading(true)
                const data = await getSession(id)
                setSession(data)
            } catch (err) {
                toast.error('Failed to load session')
                navigate('/sessions')
            } finally {
                setLoading(false)
            }
        }
        fetchSession()
    }, [id, navigate, toast])

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        )
    }

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
                                <Avatar name={session.client_name} size={48} />
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
                                <div className="text-center p-5 bg-[#E0F4F7] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#159DB3]/20 flex items-center justify-center mx-auto mb-3">
                                        <Calendar size={20} className="text-[#159DB3]" />
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
                                <div className="text-center p-5 bg-[#E0F4F7] rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#159DB3]/20 flex items-center justify-center mx-auto mb-3">
                                        <FileText size={20} className="text-[#159DB3]" />
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
                                {session.programs && session.programs.length > 0 ? (
                                    session.programs.map((program, idx) => {
                                        const programName = typeof program === 'string' ? program : program?.name || 'Unknown Program'
                                        const programType = typeof program === 'object' ? program?.program_type || 'skill' : 'skill'
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-[#E0F4F7] transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                        <Target size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-[#159DB3] transition-colors">
                                                            {programName}
                                                        </span>
                                                        <p className="text-xs text-gray-500 capitalize">{programType}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const programId = typeof program === 'object' ? program?.id : null
                                                        if (programId) {
                                                            navigate(`/programs/${programId}/progress`)
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 text-sm text-[#159DB3] font-medium hover:underline"
                                                >
                                                    <BarChart2 size={16} />
                                                    View Progress
                                                </button>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No programs recorded for this session</p>
                                )}
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

                        {/* Session Data Points */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-heading text-lg font-bold text-gray-900">Session Data</h3>
                                <span className="text-sm text-gray-500">{session.data?.length || 0} data points</span>
                            </div>

                            {session.data && session.data.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {session.data.map((dataPoint, idx) => (
                                        <div
                                            key={dataPoint.id || idx}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Result indicator */}
                                                {dataPoint.result === 'correct' && (
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CheckCircle size={16} className="text-green-600" />
                                                    </div>
                                                )}
                                                {dataPoint.result === 'incorrect' && (
                                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                                        <XCircle size={16} className="text-red-600" />
                                                    </div>
                                                )}
                                                {!dataPoint.result && dataPoint.count && (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dataPoint.count > 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                                                        <span className={`text-xs font-bold ${dataPoint.count > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                            {dataPoint.count > 0 ? `+${dataPoint.count}` : dataPoint.count}
                                                        </span>
                                                    </div>
                                                )}
                                                {!dataPoint.result && dataPoint.duration_seconds && (
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <Clock size={16} className="text-purple-600" />
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {dataPoint.program_name || 'Unknown Program'}
                                                        {dataPoint.prompt_level && (
                                                            <span className="ml-2 text-xs text-gray-500">({dataPoint.prompt_level})</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {format(new Date(dataPoint.timestamp || dataPoint.created_at), 'h:mm:ss a')}
                                                        {dataPoint.duration_seconds && ` • ${dataPoint.duration_seconds}s`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delete button - Admin only */}
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => setDeleteConfirmId(dataPoint.id)}
                                                    disabled={deleting === dataPoint.id}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove data point"
                                                >
                                                    {deleting === dataPoint.id ? (
                                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No data recorded in this session</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                {session.status !== 'completed' ? (
                                    <button
                                        onClick={() => navigate(`/sessions/${id}/collect`)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0E8499] transition-colors shadow-md"
                                    >
                                        <Play size={18} />
                                        Continue Session
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
                                        title="Session is completed"
                                    >
                                        <Play size={18} />
                                        Session Completed
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        // Export session data as CSV
                                        if (!session.data || session.data.length === 0) {
                                            toast.error('No data to export')
                                            return
                                        }
                                        const headers = ['Date', 'Program', 'Type', 'Result', 'Prompt Level', 'Count', 'Duration', 'Notes']
                                        const rows = session.data.map(d => [
                                            format(new Date(d.timestamp || d.created_at), 'yyyy-MM-dd HH:mm'),
                                            d.program_name || 'Unknown',
                                            d.data_type,
                                            d.result || '',
                                            d.prompt_level || '',
                                            d.count || '',
                                            d.duration_seconds || '',
                                            d.notes || ''
                                        ])
                                        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
                                        const blob = new Blob([csv], { type: 'text/csv' })
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `session-${session.id}-data.csv`
                                        a.click()
                                        URL.revokeObjectURL(url)
                                        toast.success('Session data exported!')
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#159DB3] hover:text-[#159DB3] transition-colors"
                                >
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
                                    <span className={`font-medium ${session.status === 'completed' ? 'text-[#159DB3]' : 'text-yellow-600'}`}>
                                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setDeleteConfirmId(null)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-600" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 text-center mb-2">
                                Remove Data Point?
                            </h3>
                            <p className="text-gray-500 text-center mb-6">
                                This data point will be removed from this session's records. This action can't be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const idToDelete = deleteConfirmId
                                        setDeleteConfirmId(null)
                                        setDeleting(idToDelete)
                                        try {
                                            await deleteSessionData(idToDelete)
                                            setSession(prev => ({
                                                ...prev,
                                                data: prev.data.filter(d => d.id !== idToDelete),
                                                data_points: (prev.data_points || 0) - 1
                                            }))
                                            toast.success('Data point removed')
                                        } catch (err) {
                                            toast.error('Failed to remove data point')
                                        } finally {
                                            setDeleting(null)
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
