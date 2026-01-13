/**
 * TargetsManager - Manage targets for a program
 * Displays list of targets with add/edit/delete functionality
 */
import { useState, useEffect } from 'react'
import { getTargets, createTarget, updateTarget, deleteTarget } from '../../services/targets'
import { getTaskSteps, createTaskStep, updateTaskStep, deleteTaskStep } from '../../services/taskSteps'
import { Plus, Edit3, Trash2, Target, ListChecks, Check, X, GripVertical } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

// Single Target Row Component
function TargetRow({ target, onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
            <GripVertical size={16} className="text-gray-300 cursor-grab" />
            <Target size={18} className="text-[#159DB3] flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{target.name}</p>
                {target.description && (
                    <p className="text-sm text-gray-500 truncate">{target.description}</p>
                )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(target)}
                    className="p-2 text-gray-400 hover:text-[#159DB3] hover:bg-white rounded-lg transition-colors"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={() => onDelete(target.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}

// Single Step Row Component
function StepRow({ step, index, onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
            <span className="w-6 h-6 bg-[#159DB3] text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                {index + 1}
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{step.name}</p>
                {step.description && (
                    <p className="text-sm text-gray-500 truncate">{step.description}</p>
                )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(step)}
                    className="p-2 text-gray-400 hover:text-[#159DB3] hover:bg-white rounded-lg transition-colors"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={() => onDelete(step.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    )
}

// Add/Edit Modal
function ItemModal({ isOpen, onClose, onSave, item, type }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (item) {
            setName(item.name || '')
            setDescription(item.description || '')
        } else {
            setName('')
            setDescription('')
        }
    }, [item])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setSaving(true)
        try {
            await onSave({ name: name.trim(), description: description.trim() })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">
                            {item ? `Edit ${type}` : `Add ${type}`}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {type} Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3] focus:border-transparent"
                                    placeholder={`Enter ${type.toLowerCase()} name...`}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#159DB3] focus:border-transparent"
                                    rows={2}
                                    placeholder="Add a description..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || saving}
                            className="px-6 py-2 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0E8499] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : (
                                <>
                                    <Check size={16} />
                                    {item ? 'Update' : 'Add'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function TargetsManager({ programId, dataType }) {
    const { toast } = useToast()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)

    const isTaskAnalysis = dataType === 'task_analysis'
    const itemType = isTaskAnalysis ? 'Step' : 'Target'

    // Load items
    useEffect(() => {
        const loadItems = async () => {
            try {
                setLoading(true)
                const data = isTaskAnalysis
                    ? await getTaskSteps(programId)
                    : await getTargets(programId)
                setItems(data)
            } catch (err) {
                console.error('Failed to load items:', err)
            } finally {
                setLoading(false)
            }
        }
        loadItems()
    }, [programId, isTaskAnalysis])

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleEdit = (item) => {
        setEditingItem(item)
        setModalOpen(true)
    }

    const handleSave = async (data) => {
        try {
            if (editingItem) {
                // Update
                if (isTaskAnalysis) {
                    await updateTaskStep(editingItem.id, data)
                } else {
                    await updateTarget(editingItem.id, data)
                }
                setItems(prev => prev.map(item =>
                    item.id === editingItem.id ? { ...item, ...data } : item
                ))
                toast.success(`${itemType} updated!`)
            } else {
                // Create
                let newItem
                if (isTaskAnalysis) {
                    newItem = await createTaskStep(programId, { ...data, position: items.length + 1 })
                } else {
                    newItem = await createTarget(programId, data)
                }
                setItems(prev => [...prev, newItem])
                toast.success(`${itemType} added!`)
            }
        } catch (err) {
            toast.error(err.message || `Failed to save ${itemType.toLowerCase()}`)
            throw err
        }
    }

    const handleDelete = async (itemId) => {
        if (!window.confirm(`Delete this ${itemType.toLowerCase()}?`)) return

        try {
            if (isTaskAnalysis) {
                await deleteTaskStep(itemId)
            } else {
                await deleteTarget(itemId)
            }
            setItems(prev => prev.filter(item => item.id !== itemId))
            toast.success(`${itemType} deleted!`)
        } catch (err) {
            toast.error(err.message || `Failed to delete ${itemType.toLowerCase()}`)
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[#159DB3] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {isTaskAnalysis ? (
                        <ListChecks size={24} className="text-[#159DB3]" />
                    ) : (
                        <Target size={24} className="text-[#159DB3]" />
                    )}
                    <div>
                        <h3 className="font-heading text-lg font-bold text-gray-900">
                            {isTaskAnalysis ? 'Task Steps' : 'Targets'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isTaskAnalysis
                                ? 'Define the steps for this task analysis'
                                : 'Add specific targets to track for this program'
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0E8499] transition-colors"
                >
                    <Plus size={18} />
                    Add {itemType}
                </button>
            </div>

            {/* Content */}
            <div className="p-6">
                {items.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            {isTaskAnalysis ? (
                                <ListChecks size={32} className="text-gray-400" />
                            ) : (
                                <Target size={32} className="text-gray-400" />
                            )}
                        </div>
                        <p className="text-gray-500 mb-2">
                            No {isTaskAnalysis ? 'steps' : 'targets'} yet
                        </p>
                        <p className="text-sm text-gray-400">
                            {isTaskAnalysis
                                ? 'Add steps to break down this task'
                                : 'Add targets to track specific skills within this program'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            isTaskAnalysis ? (
                                <StepRow
                                    key={item.id}
                                    step={item}
                                    index={index}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ) : (
                                <TargetRow
                                    key={item.id}
                                    target={item}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <ItemModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
                type={itemType}
            />
        </div>
    )
}
