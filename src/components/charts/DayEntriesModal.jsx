/**
 * The values behind one point on a progress chart.
 *
 * Dena (BCBA, Cor Behavioral), 22 Sept 2026:
 *   "The inability to completely delete data points or modify a data point
 *    from the graph (BCBA level)"
 *
 * Correcting and removing a value already existed, on the session page. A
 * supervisor reading a graph was not there, and had a date rather than a
 * session id, so the work was unreachable rather than missing. This is the way
 * in: open a point, see what was recorded that day, fix or remove the one that
 * is wrong.
 *
 * Every control here is checked again on the server. Hiding one is a courtesy
 * so nobody is offered an action that can only be refused, never a boundary.
 */
import { useCallback, useEffect, useState } from 'react'
import { X, Pencil, Trash2, Loader2, AlertCircle, Lock } from 'lucide-react'
import { getProgramDayEntries } from '../../services/analytics'
import { editSessionData, deleteSessionData } from '../../services/sessions'
import { useToast } from '../../context/ToastContext'
import { canAmendData, canSuperviseData } from '../../utils/permissions'

/** An audit reason that says nothing is worse than none, because it looks like one. */
const MIN_REASON = 5

/** What the value actually is, in the words the clinician recorded it in. */
export function describeEntry(entry) {
    if (entry?.is_summary) return `${entry.summary_percentage ?? 0}% (entered)`
    switch (entry?.data_type) {
        case 'frequency':
            return `${entry.count ?? 0} occurrence${entry.count === 1 ? '' : 's'}`
        case 'duration':
            return `${entry.duration_seconds ?? 0}s`
        case 'latency':
            return `${entry.duration_seconds ?? 0}s to onset`
        default:
            return entry?.result || '—'
    }
}

/**
 * Which field a correction writes to.
 *
 * Sending the wrong one is refused by the server as a type mismatch, and a
 * typed percentage in particular has no result to change: the figure itself is
 * the data. That was Dena's own example, a 60% entered for a past day.
 */
export function correctionField(entry) {
    if (entry?.is_summary) return 'summary_percentage'
    switch (entry?.data_type) {
        case 'frequency': return 'count'
        case 'duration':
        case 'latency': return 'duration_seconds'
        default: return 'result'
    }
}

const RESULTS = {
    trial: ['correct', 'incorrect'],
    partial_interval: ['present', 'absent'],
    whole_interval: ['present', 'absent'],
    momentary_time_sampling: ['present', 'absent'],
}

export default function DayEntriesModal({ programId, date, dateLabel, user, onClose, onChanged }) {
    const { toast } = useToast()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [editing, setEditing] = useState(null)   // entry id
    const [removing, setRemoving] = useState(null) // entry id
    const [value, setValue] = useState('')
    const [reason, setReason] = useState('')
    const [reasonError, setReasonError] = useState(false)
    const [busy, setBusy] = useState(false)

    const canAmend = canAmendData(user)
    const canSupervise = canSuperviseData(user)

    const load = useCallback(async () => {
        setLoading(true)
        setFailed(false)
        try {
            const data = await getProgramDayEntries(programId, date)
            setEntries(data?.entries || [])
        } catch (err) {
            console.error('Failed to load the entries for this day:', err)
            setFailed(true)
        } finally {
            setLoading(false)
        }
    }, [programId, date])

    useEffect(() => { load() }, [load])

    const reset = () => {
        setEditing(null)
        setRemoving(null)
        setValue('')
        setReason('')
        setReasonError(false)
    }

    const startEdit = (entry) => {
        reset()
        setEditing(entry.id)
        const field = correctionField(entry)
        setValue(field === 'summary_percentage'
            ? String(entry.summary_percentage ?? '')
            : String(entry[field] ?? ''))
    }

    const saveEdit = async (entry) => {
        if (reason.trim().length < MIN_REASON) {
            setReasonError(true)
            return
        }
        const field = correctionField(entry)
        const payload = { edit_reason: reason.trim() }
        payload[field] = field === 'result' ? value : Number(value)

        setBusy(true)
        try {
            await editSessionData(entry.id, payload)
            toast.success('Value corrected')
            reset()
            await load()
            onChanged?.()
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Could not correct that value')
        } finally {
            setBusy(false)
        }
    }

    const confirmRemove = async (entry) => {
        if (reason.trim().length < MIN_REASON) {
            setReasonError(true)
            return
        }
        setBusy(true)
        try {
            await deleteSessionData(entry.id, reason.trim())
            toast.success('Value removed')
            reset()
            await load()
            onChanged?.()
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Could not remove that value')
        } finally {
            setBusy(false)
        }
    }

    const reasonField = (label) => (
        <div className="mt-3">
            <label htmlFor="entry-reason" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Reason
            </label>
            <input
                id="entry-reason"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReasonError(false) }}
                placeholder={label}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159DB3] ${reasonError ? 'border-red-400' : 'border-gray-200'}`}
            />
            {reasonError && (
                <p className="text-xs text-red-500 mt-1">
                    Please say why. It is kept with the record so a reviewer can see what changed and why.
                </p>
            )}
        </div>
    )

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-[#159DB3] to-[#0D7C8C] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Data recorded on {dateLabel}</h2>
                        <p className="text-white/70 text-sm">Correct or remove a value</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-10">
                            <Loader2 className="w-7 h-7 animate-spin text-[#159DB3] mx-auto" />
                        </div>
                    ) : failed ? (
                        <div className="text-center py-10">
                            <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
                            <p className="text-gray-600">Could not load this day's data.</p>
                        </div>
                    ) : !entries.length ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Nothing was recorded against this program on {dateLabel}.</p>
                        </div>
                    ) : (
                        <>
                            {!canAmend && (
                                <div className="mb-4 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                                    <Lock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-500">
                                        Only BCBAs, coordinators and administrators can change recorded data.
                                        Ask your supervisor if something here needs correcting.
                                    </p>
                                </div>
                            )}

                            <ul className="space-y-2">
                                {entries.map((entry) => (
                                    <li key={entry.id} className="border border-gray-200 rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900">{describeEntry(entry)}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {entry.target_name || 'Whole program'}
                                                    {entry.recorded_by ? ` · ${entry.recorded_by}` : ''}
                                                </p>
                                            </div>
                                            {canAmend && editing !== entry.id && removing !== entry.id && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => startEdit(entry)}
                                                        className="flex items-center gap-1 text-sm font-semibold text-[#159DB3] hover:text-[#0E8499] px-2 py-1"
                                                    >
                                                        <Pencil size={14} /> Correct
                                                    </button>
                                                    {canSupervise && (
                                                        <button
                                                            onClick={() => { reset(); setRemoving(entry.id) }}
                                                            className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-600 px-2 py-1"
                                                        >
                                                            <Trash2 size={14} /> Remove
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {editing === entry.id && (
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                <label htmlFor="entry-value" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Value
                                                </label>
                                                {RESULTS[entry.data_type] && !entry.is_summary ? (
                                                    <select
                                                        id="entry-value"
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159DB3]"
                                                    >
                                                        {RESULTS[entry.data_type].map((r) => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        id="entry-value"
                                                        type="number"
                                                        value={value}
                                                        onChange={(e) => setValue(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159DB3]"
                                                    />
                                                )}
                                                {reasonField('e.g. scored against the wrong target')}
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={reset} className="flex-1 py-2 text-sm border-2 border-gray-200 rounded-lg font-semibold text-gray-600">
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => saveEdit(entry)}
                                                        disabled={busy}
                                                        className="flex-1 py-2 text-sm bg-[#159DB3] text-white rounded-lg font-semibold disabled:opacity-50"
                                                    >
                                                        {busy ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {removing === entry.id && (
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                <p className="text-sm text-gray-600">
                                                    This value leaves the graph and the totals. It is kept in the record
                                                    so it can be reviewed later.
                                                </p>
                                                {reasonField('e.g. recorded on the wrong client')}
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={reset} className="flex-1 py-2 text-sm border-2 border-gray-200 rounded-lg font-semibold text-gray-600">
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => confirmRemove(entry)}
                                                        disabled={busy}
                                                        className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                                    >
                                                        {busy ? 'Removing...' : 'Confirm'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
