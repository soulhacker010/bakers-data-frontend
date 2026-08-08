import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { createPhaseLine, updatePhaseLine, deletePhaseLine } from '../../services/phaseLines'
import { useToast } from '../../context/ToastContext'

/**
 * Add, rename and remove the phase change lines on a program's graph.
 *
 * The clinical team asked for two things: lines they place themselves, and the
 * ability to change the wording afterwards. Renaming is inline rather than in a
 * dialog, because correcting a label is the thing they said they do most.
 */
export default function PhaseLineManager({ programId, lines, onChanged }) {
    const { toast } = useToast()
    const [adding, setAdding] = useState(false)
    const [draft, setDraft] = useState({ date: '', title: '' })
    const [editingId, setEditingId] = useState(null)
    const [editTitle, setEditTitle] = useState('')
    const [busy, setBusy] = useState(false)

    const handleAdd = async () => {
        if (!draft.date) return toast.error('Please choose the date the phase changed')
        if (!draft.title.trim()) return toast.error('Please give the phase a name')

        setBusy(true)
        try {
            await createPhaseLine(programId, { date: draft.date, title: draft.title.trim() })
            setDraft({ date: '', title: '' })
            setAdding(false)
            toast.success('Phase change added')
            onChanged?.()
        } catch (err) {
            toast.error(err.message || 'Could not add that phase change')
        } finally {
            setBusy(false)
        }
    }

    const handleRename = async (id) => {
        if (!editTitle.trim()) return toast.error('The phase needs a name')

        setBusy(true)
        try {
            await updatePhaseLine(id, { title: editTitle.trim() })
            setEditingId(null)
            toast.success('Phase renamed')
            onChanged?.()
        } catch (err) {
            toast.error(err.message || 'Could not rename that phase')
        } finally {
            setBusy(false)
        }
    }

    const handleRemove = async (id) => {
        setBusy(true)
        try {
            await deletePhaseLine(id)
            toast.success('Phase change removed')
            onChanged?.()
        } catch (err) {
            toast.error(err.message || 'Could not remove that phase change')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="border-t border-gray-100 mt-6 pt-5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-heading text-sm font-bold text-gray-900">Phase Changes</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Vertical lines marking where the approach changed.
                    </p>
                </div>
                {!adding && (
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#159DB3] hover:text-[#128098]"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                )}
            </div>

            {adding && (
                <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                    <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#159DB3] focus:outline-none"
                    />
                    <input
                        type="text"
                        value={draft.title}
                        maxLength={60}
                        placeholder="e.g. Functional Communication Training"
                        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                        className="flex-1 min-w-[200px] px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#159DB3] focus:outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={busy}
                        className="px-4 py-2 bg-[#159DB3] text-white rounded-lg text-sm font-semibold hover:bg-[#128098] disabled:opacity-60"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => { setAdding(false); setDraft({ date: '', title: '' }) }}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {lines.length === 0 ? (
                <p className="text-sm text-gray-400">
                    No phase changes marked yet. Add one to show where a baseline ends and an
                    intervention begins.
                </p>
            ) : (
                <ul className="space-y-1.5">
                    {lines.map(line => (
                        <li
                            key={line.id}
                            className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg group"
                        >
                            <span className="text-xs font-mono text-gray-500 shrink-0 w-20">
                                {format(parseISO(line.date + 'T12:00:00'), 'MMM d, yy')}
                            </span>

                            {editingId === line.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        maxLength={60}
                                        autoFocus
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename(line.id)
                                            if (e.key === 'Escape') setEditingId(null)
                                        }}
                                        className="flex-1 px-2 py-1 border-2 border-[#159DB3] rounded text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleRename(line.id)}
                                        disabled={busy}
                                        className="p-1.5 text-[#159DB3] hover:bg-[#E0F4F7] rounded"
                                        title="Save"
                                    >
                                        <Check size={15} />
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="p-1.5 text-gray-400 hover:bg-gray-200 rounded"
                                        title="Cancel"
                                    >
                                        <X size={15} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                                        {line.title}
                                    </span>
                                    <button
                                        onClick={() => { setEditingId(line.id); setEditTitle(line.title) }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#159DB3] hover:bg-[#E0F4F7] rounded transition-all"
                                        title="Rename this phase"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleRemove(line.id)}
                                        disabled={busy}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        title="Remove this phase change"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
