import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Avatar } from '../components/ui'
import { getSession } from '../services/sessions'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Calendar, Clock, FileText, Play, Download, Target, Activity, BarChart2, User, Trash2, CheckCircle, XCircle, Edit3, StopCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedDate } from '../utils/datetime'
import { canAmendData, canSuperviseData } from '../utils/permissions'
import { deleteSessionData, editSessionData, editSessionTimes, endSession } from '../services/sessions'
import SessionWellnessStrip from '../components/wellness/SessionWellnessStrip'

export default function SessionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null) // Track which item is being deleted
    const [deleteConfirmId, setDeleteConfirmId] = useState(null) // For delete confirmation modal
    const [showTimeEditModal, setShowTimeEditModal] = useState(false)
    const [timeEditForm, setTimeEditForm] = useState({
        start_time: '',
        end_time: '',
        edit_reason: ''
    })
    const [savingTimeEdit, setSavingTimeEdit] = useState(false)
    const [showEndConfirm, setShowEndConfirm] = useState(false)
    const [endingSession, setEndingSession] = useState(false)
    // Correcting a single recorded data point (BCBA/admin).
    const [editingPoint, setEditingPoint] = useState(null)
    const [dataEditForm, setDataEditForm] = useState({ result: '', count: '', duration_seconds: '', edit_reason: '' })
    const [savingDataEdit, setSavingDataEdit] = useState(false)

    // Whether the current user is allowed to end this session.
    // Matches backend permission: session owner, admin/superadmin, or BCBA role.
    // Used to expose an End Session button when a therapist forgot to close their session
    // so a BCBA/admin can close it (per Dena/Joe's request).
    const role = (user?.role || '').toLowerCase()
    const canEndSession =
        session?.status !== 'completed' && (
            (session?.user_id != null && session.user_id === user?.id) ||
            user?.is_admin ||
            user?.is_superadmin ||
            role === 'bcba'
        )
    const isSessionOwner = session?.user_id != null && session.user_id === user?.id

    // Correcting a value and removing one are separate permissions: a
    // coordinator may fix a mis-scored trial, but removing data stays with
    // supervision. Mirrors app/core/roles.py on the server.
    const canAmend = canAmendData(user)
    const canSupervise = canSuperviseData(user)

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
                                        {format(toZonedDate(session.start_time), 'EEEE, MMMM d, yyyy')}
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
                                        {format(toZonedDate(session.start_time), 'MMM d')}
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

                        {/* Wellness check-ins recorded during this session */}
                        <SessionWellnessStrip sessionId={session.id} />

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
                                                {dataPoint.data_type === 'task_analysis' && (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dataPoint.prompt_level === 'independent' ? 'bg-green-100' : 'bg-amber-100'}`}>
                                                        <span className={`text-[10px] font-bold ${dataPoint.prompt_level === 'independent' ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {dataPoint.prompt_level === 'independent' ? 'IND' : 'P'}
                                                        </span>
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
                                                        {format(toZonedDate(dataPoint.timestamp || dataPoint.created_at), 'h:mm:ss a')}
                                                        {dataPoint.duration_seconds && ` • ${dataPoint.duration_seconds}s`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Correct or remove a data point */}
                                            {canAmend && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setDataEditForm({
                                                                result: dataPoint.result || '',
                                                                count: dataPoint.count ?? '',
                                                                duration_seconds: dataPoint.duration_seconds ?? '',
                                                                edit_reason: '',
                                                            })
                                                            setEditingPoint(dataPoint)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-[#159DB3] hover:bg-[#E0F4F7] rounded-lg transition-all"
                                                        title="Correct this data point"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    {/* Removal is destructive, so it stays with
                                                        supervision rather than with coordinators. */}
                                                    {canSupervise && (
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
                                    <>
                                        {isSessionOwner && (
                                            <button
                                                onClick={() => navigate(`/sessions/${id}/collect`)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0E8499] transition-colors shadow-md"
                                            >
                                                <Play size={18} />
                                                Continue Session
                                            </button>
                                        )}
                                        {canEndSession && (
                                            <button
                                                onClick={() => setShowEndConfirm(true)}
                                                disabled={endingSession}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={isSessionOwner ? 'End this session' : 'End this session on behalf of the therapist'}
                                            >
                                                <StopCircle size={18} />
                                                {endingSession ? 'Ending…' : 'End Session'}
                                            </button>
                                        )}
                                    </>
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
                                            format(toZonedDate(d.timestamp || d.created_at), 'yyyy-MM-dd HH:mm'),
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
                                    <span className="text-gray-900">{format(toZonedDate(session.start_time), 'h:mm a')}</span>
                                </div>
                                {session.end_time && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">End Time</span>
                                        <span className="text-gray-900">{format(toZonedDate(session.end_time), 'h:mm a')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`font-medium ${session.status === 'completed' ? 'text-[#159DB3]' : 'text-yellow-600'}`}>
                                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                                
                                {/* Edit Times Button - Available to all therapists */}
                                <button
                                        onClick={() => {
                                            // Pre-fill form with current times
                                            const toLocalInput = (isoStr) => {
                                                if (!isoStr) return ''
                                                const d = new Date(isoStr)
                                                return d.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
                                            }
                                            setTimeEditForm({
                                                start_time: toLocalInput(session.start_time),
                                                end_time: toLocalInput(session.end_time),
                                                edit_reason: ''
                                            })
                                            setShowTimeEditModal(true)
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 border-2 border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-colors text-sm"
                                    >
                                        <Edit3 size={16} />
                                        Edit Times
                                    </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Correct Data Point Modal — BCBAs fixing an entry recorded in error.
                Which fields appear is driven by what the data point actually
                holds, so the same modal serves trial, interval, frequency and
                duration records without hardcoding program types. */}
            {editingPoint && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => !savingDataEdit && setEditingPoint(null)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">
                                Correct Data Point
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                {editingPoint.program_name || 'Unknown Program'} ·{' '}
                                {format(toZonedDate(editingPoint.timestamp || editingPoint.created_at), 'h:mm:ss a')}
                            </p>

                            {/* Scored results: correct/incorrect for trials and task
                                analysis, present/absent for interval recording. */}
                            {editingPoint.result && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Result</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['present', 'absent'].includes(editingPoint.result)
                                            ? [['present', 'Present'], ['absent', 'Absent']]
                                            : [['correct', 'Correct'], ['incorrect', 'Incorrect']]
                                        ).map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() => setDataEditForm(f => ({ ...f, result: value }))}
                                                className={`py-3 rounded-xl font-semibold border-2 transition-colors ${dataEditForm.result === value
                                                    ? 'bg-[#E0F4F7] border-[#159DB3] text-[#159DB3]'
                                                    : 'bg-gray-50 border-transparent text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {editingPoint.count != null && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Count</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dataEditForm.count}
                                        onChange={(e) => setDataEditForm(f => ({ ...f, count: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                    />
                                </div>
                            )}

                            {editingPoint.duration_seconds != null && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (seconds)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dataEditForm.duration_seconds}
                                        onChange={(e) => setDataEditForm(f => ({ ...f, duration_seconds: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                    />
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for the correction
                                </label>
                                <input
                                    type="text"
                                    value={dataEditForm.edit_reason}
                                    onChange={(e) => setDataEditForm(f => ({ ...f, edit_reason: e.target.value }))}
                                    placeholder="e.g. Scored in error during session"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Recorded in the audit log alongside the original value.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingPoint(null)}
                                    disabled={savingDataEdit}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (dataEditForm.edit_reason.trim().length < 5) {
                                            toast.error('Please give a reason of at least 5 characters')
                                            return
                                        }
                                        setSavingDataEdit(true)
                                        try {
                                            const payload = { edit_reason: dataEditForm.edit_reason.trim() }
                                            if (editingPoint.result && dataEditForm.result) {
                                                payload.result = dataEditForm.result
                                            }
                                            if (editingPoint.count != null && dataEditForm.count !== '') {
                                                payload.count = parseInt(dataEditForm.count, 10)
                                            }
                                            if (editingPoint.duration_seconds != null && dataEditForm.duration_seconds !== '') {
                                                payload.duration_seconds = parseInt(dataEditForm.duration_seconds, 10)
                                            }
                                            const updated = await editSessionData(editingPoint.id, payload)
                                            setSession(prev => ({
                                                ...prev,
                                                data: prev.data.map(d => (d.id === updated.id ? { ...d, ...updated } : d)),
                                            }))
                                            setEditingPoint(null)
                                            toast.success('Data point corrected')
                                        } catch (err) {
                                            toast.error(err.message || 'Failed to correct data point')
                                        } finally {
                                            setSavingDataEdit(false)
                                        }
                                    }}
                                    disabled={savingDataEdit}
                                    className="flex-1 px-4 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#128098] transition-colors disabled:opacity-60"
                                >
                                    {savingDataEdit ? 'Saving...' : 'Save Correction'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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

            {/* End Session Confirmation Modal */}
            {showEndConfirm && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => !endingSession && setShowEndConfirm(false)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <StopCircle size={24} className="text-red-600" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 text-center mb-2">
                                End This Session?
                            </h3>
                            <p className="text-gray-500 text-center mb-6">
                                {isSessionOwner
                                    ? 'This will mark the session as completed and lock its duration. You can still review the data afterward.'
                                    : `This session was started by another therapist and is still open. Ending it will close it on their behalf and the action will be recorded in the audit log.`}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEndConfirm(false)}
                                    disabled={endingSession}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={endingSession}
                                    onClick={async () => {
                                        setEndingSession(true)
                                        try {
                                            const updated = await endSession(session.id, '')
                                            setSession(prev => ({
                                                ...prev,
                                                ...updated,
                                                status: 'completed',
                                            }))
                                            toast.success('Session ended')
                                            setShowEndConfirm(false)
                                        } catch (err) {
                                            toast.error(err.response?.data?.detail || 'Failed to end session')
                                        } finally {
                                            setEndingSession(false)
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {endingSession ? 'Ending…' : 'End Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Session Times Modal */}
            {showTimeEditModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setShowTimeEditModal(false)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                                <Clock size={24} className="text-amber-600" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 text-center mb-2">
                                Edit Session Times
                            </h3>
                            <p className="text-gray-500 text-center text-sm mb-6">
                                Adjust session start/end times for accurate billing. This will be logged in the audit trail.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={timeEditForm.start_time}
                                        onChange={(e) => setTimeEditForm(prev => ({ ...prev, start_time: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#159DB3] focus:ring-4 focus:ring-[#159DB3]/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={timeEditForm.end_time}
                                        onChange={(e) => setTimeEditForm(prev => ({ ...prev, end_time: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#159DB3] focus:ring-4 focus:ring-[#159DB3]/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Edit *</label>
                                    <textarea
                                        value={timeEditForm.edit_reason}
                                        onChange={(e) => setTimeEditForm(prev => ({ ...prev, edit_reason: e.target.value }))}
                                        placeholder="e.g., Therapist forgot to start timer, adjusting for actual session time"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#159DB3] focus:ring-4 focus:ring-[#159DB3]/10 min-h-[80px] resize-y"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowTimeEditModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!timeEditForm.edit_reason || timeEditForm.edit_reason.length < 5 || savingTimeEdit}
                                    onClick={async () => {
                                        setSavingTimeEdit(true)
                                        try {
                                            const payload = { edit_reason: timeEditForm.edit_reason }
                                            if (timeEditForm.start_time) {
                                                payload.start_time = new Date(timeEditForm.start_time).toISOString()
                                            }
                                            if (timeEditForm.end_time) {
                                                payload.end_time = new Date(timeEditForm.end_time).toISOString()
                                            }
                                            const result = await editSessionTimes(session.id, payload)
                                            // Refresh session data
                                            setSession(prev => ({
                                                ...prev,
                                                start_time: result.start_time,
                                                end_time: result.end_time,
                                                duration_minutes: result.duration_minutes,
                                            }))
                                            toast.success('Session times updated')
                                            setShowTimeEditModal(false)
                                        } catch (err) {
                                            toast.error(err.response?.data?.detail || 'Failed to update session times')
                                        } finally {
                                            setSavingTimeEdit(false)
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0E8499] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingTimeEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
