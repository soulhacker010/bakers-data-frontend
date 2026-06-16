/**
 * TargetsList Component - Displays targets for a program with progress indicators
 */
import { useState, useEffect } from 'react'
import { getTargets, updateTarget, deleteTarget } from '../../services/targets'
import { Target, CheckCircle2, Clock, Pause, MoreVertical, Trash2, Edit2 } from 'lucide-react'

// Status badge component
function StatusBadge({ status }) {
    const styles = {
        active: 'bg-blue-50 text-blue-600 border-blue-200',
        mastered: 'bg-green-50 text-green-600 border-green-200',
        'on-hold': 'bg-yellow-50 text-yellow-600 border-yellow-200',
        maintenance: 'bg-purple-50 text-purple-600 border-purple-200'
    }

    const icons = {
        active: <Clock size={12} />,
        mastered: <CheckCircle2 size={12} />,
        'on-hold': <Pause size={12} />,
        maintenance: <Target size={12} />
    }

    const labels = {
        active: 'Active',
        mastered: 'Mastered',
        'on-hold': 'On Hold',
        maintenance: 'Maintenance'
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.active}`}>
            {icons[status] || icons.active}
            {labels[status] || 'Active'}
        </span>
    )
}

// Progress bar component
function ProgressBar({ accuracy, threshold }) {
    const percentage = Math.min(100, accuracy)
    const isAtThreshold = accuracy >= threshold

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isAtThreshold ? 'bg-green-500' : 'bg-[#159DB3]'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={`text-xs font-medium ${isAtThreshold ? 'text-green-600' : 'text-gray-500'}`}>
                {accuracy.toFixed(0)}%
            </span>
        </div>
    )
}

// Single Target Item
function TargetItem({ target, onUpdate, onDelete, onEdit, showActions = true }) {
    const [showMenu, setShowMenu] = useState(false)

    const handleStatusChange = async (newStatus) => {
        await onUpdate(target.id, { status: newStatus })
        setShowMenu(false)
    }

    const handleEdit = () => {
        setShowMenu(false)
        if (onEdit) onEdit(target)
    }

    return (
        <div className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
            {/* Status indicator */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${target.status === 'mastered'
                ? 'bg-green-100 text-green-600'
                : target.status === 'on-hold'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-[#E0F4F7] text-[#159DB3]'
                }`}>
                <Target size={20} />
            </div>

            {/* Target info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{target.name}</h4>
                    <StatusBadge status={target.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{target.mastery_threshold}% × {target.mastery_consecutive_sessions} sessions</span>
                </div>
            </div>

            {/* Mastery Progress */}
            <div className="w-40 text-right">
                {/* Progress toward mastery (sessions at criteria) */}
                {(() => {
                    const masteryProgress = Math.round((target.sessions_at_criteria / target.mastery_consecutive_sessions) * 100)
                    return (
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-sm font-semibold ${target.status === 'mastered' ? 'text-green-600' : 'text-[#159DB3]'}`}>
                                {masteryProgress}% to mastery
                            </span>
                            <span className="text-xs text-gray-400">
                                {target.sessions_at_criteria}/{target.mastery_consecutive_sessions} sessions
                            </span>
                        </div>
                    )
                })()}
            </div>

            {/* Actions */}
            {showActions && (
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                <button
                                    onClick={() => handleStatusChange('active')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Clock size={14} /> Set Active
                                </button>
                                <button
                                    onClick={() => handleStatusChange('mastered')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                >
                                    <CheckCircle2 size={14} /> Mark Mastered
                                </button>
                                <button
                                    onClick={() => handleStatusChange('on-hold')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-yellow-600"
                                >
                                    <Pause size={14} /> Put On Hold
                                </button>
                                <hr className="my-1" />
                                <button
                                    onClick={handleEdit}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> Edit Target
                                </button>
                                <button
                                    onClick={() => { onDelete(target.id); setShowMenu(false) }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// Main TargetsList component
export default function TargetsList({ programId, onTargetSelect, selectedTargetId, compact = false }) {
    const [targets, setTargets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingTarget, setEditingTarget] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '', description: '',
        measurement_type: '', interval_seconds: 30, observation_minutes: 10,
    })

    useEffect(() => {
        const fetchTargets = async () => {
            if (!programId) return

            try {
                setLoading(true)
                const data = await getTargets(programId)
                setTargets(data)
            } catch (err) {
                console.error('Failed to load targets:', err)
                setError('Failed to load targets')
            } finally {
                setLoading(false)
            }
        }
        fetchTargets()
    }, [programId])

    const handleUpdate = async (targetId, updates) => {
        try {
            const updated = await updateTarget(targetId, updates)
            setTargets(prev => prev.map(t => t.id === targetId ? updated : t))
        } catch (err) {
            console.error('Failed to update target:', err)
        }
    }

    const handleDelete = async (targetId) => {
        if (!confirm('Delete this target?')) return

        try {
            await deleteTarget(targetId)
            setTargets(prev => prev.filter(t => t.id !== targetId))
        } catch (err) {
            console.error('Failed to delete target:', err)
        }
    }

    const handleEdit = (target) => {
        setEditingTarget(target)
        const secs = target.interval_seconds || 30
        const count = target.interval_count || 20
        setEditForm({
            name: target.name,
            description: target.description || '',
            measurement_type: target.measurement_type || '',
            interval_seconds: secs,
            observation_minutes: Math.max(1, Math.round((count * secs) / 60)),
        })
    }

    const handleSaveEdit = async () => {
        if (!editingTarget) return
        const isInterval = ['partial_interval', 'whole_interval', 'momentary_time_sampling'].includes(editForm.measurement_type)
        const payload = {
            name: editForm.name,
            description: editForm.description,
            // empty string => clear the override (send null)
            measurement_type: editForm.measurement_type || null,
        }
        if (isInterval) {
            payload.interval_seconds = Number(editForm.interval_seconds)
            payload.interval_count = Math.max(1, Math.round((Number(editForm.observation_minutes) * 60) / Number(editForm.interval_seconds)))
        }
        try {
            await handleUpdate(editingTarget.id, payload)
            setEditingTarget(null)
        } catch (err) {
            console.error('Failed to save target:', err)
        }
    }

    if (loading) {
        return (
            <div className="py-8 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-[#159DB3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading targets...
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-8 text-center text-red-500">
                {error}
            </div>
        )
    }

    if (targets.length === 0) {
        return (
            <div className="py-8 text-center">
                <Target size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No targets defined for this program</p>
                <p className="text-sm text-gray-400">Add targets when editing the program</p>
            </div>
        )
    }

    // Compact mode for sidebar
    if (compact) {
        return (
            <div className="space-y-1">
                {targets.map(target => (
                    <button
                        key={target.id}
                        onClick={() => onTargetSelect?.(target)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedTargetId === target.id
                            ? 'bg-[#159DB3] text-white'
                            : 'hover:bg-gray-100'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedTargetId === target.id
                            ? 'bg-white/20'
                            : target.status === 'mastered'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-[#E0F4F7] text-[#159DB3]'
                            }`}>
                            {target.status === 'mastered' ? <CheckCircle2 size={16} /> : <Target size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${selectedTargetId === target.id ? 'text-white' : 'text-gray-900'}`}>
                                {target.name}
                            </p>
                            <p className={`text-xs ${selectedTargetId === target.id ? 'text-white/70' : 'text-gray-500'}`}>
                                {target.current_accuracy.toFixed(0)}% accuracy
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        )
    }

    // Full mode
    return (
        <>
            {/* Edit Modal */}
            {editingTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">Edit Target</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Measurement method</label>
                                <select
                                    value={editForm.measurement_type}
                                    onChange={(e) => setEditForm({ ...editForm, measurement_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                >
                                    <option value="">Inherit program default</option>
                                    <option value="partial_interval">Partial Interval</option>
                                    <option value="whole_interval">Whole Interval</option>
                                    <option value="momentary_time_sampling">Momentary Time Sampling</option>
                                    <option value="latency">Latency</option>
                                </select>
                            </div>
                            {['partial_interval', 'whole_interval', 'momentary_time_sampling'].includes(editForm.measurement_type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval length (sec)</label>
                                        <input type="number" min="1" value={editForm.interval_seconds}
                                            onChange={(e) => setEditForm({ ...editForm, interval_seconds: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Observation (min)</label>
                                        <input type="number" min="1" value={editForm.observation_minutes}
                                            onChange={(e) => setEditForm({ ...editForm, observation_minutes: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]" />
                                    </div>
                                    <p className="col-span-2 text-xs text-gray-400">
                                        = {Math.max(1, Math.round((Number(editForm.observation_minutes) * 60) / Number(editForm.interval_seconds || 1)))} intervals
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingTarget(null)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 px-4 py-3 bg-[#159DB3] text-white rounded-xl font-medium hover:bg-[#128a9e] transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {targets.map(target => (
                    <TargetItem
                        key={target.id}
                        target={target}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                ))}
            </div>
        </>
    )
}
