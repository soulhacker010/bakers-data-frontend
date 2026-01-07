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
function TargetItem({ target, onUpdate, onDelete, showActions = true }) {
    const [showMenu, setShowMenu] = useState(false)

    const handleStatusChange = async (newStatus) => {
        await onUpdate(target.id, { status: newStatus })
        setShowMenu(false)
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
                    <span>{target.sessions_at_criteria}/{target.mastery_consecutive_sessions} at criteria</span>
                </div>
            </div>

            {/* Progress */}
            <div className="w-32">
                <ProgressBar accuracy={target.current_accuracy} threshold={target.mastery_threshold} />
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
        <div className="space-y-2">
            {targets.map(target => (
                <TargetItem
                    key={target.id}
                    target={target}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    )
}
