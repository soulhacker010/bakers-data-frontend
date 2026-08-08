import { useState } from 'react'
import { setUserRole } from '../../services/admin'
import { useToast } from '../../context/ToastContext'

/**
 * Assign a clinical role.
 *
 * The role decides what someone may do with recorded data, so it is the one
 * thing a person must never set for themselves. It used to be pickable at
 * signup and changeable in settings; both were removed. This is the only way
 * it changes, and every change is written to the audit log.
 *
 * Used both inline in the therapists table and in the detail drawer, so the
 * two cannot drift apart.
 */

// Mirrors ASSIGNABLE_ROLES in app/core/roles.py.
export const ROLES = [
    { value: 'bcba', label: 'BCBA', hint: 'Full clinical supervision' },
    { value: 'coordinator', label: 'Coordinator', hint: 'May correct data, cannot remove it' },
    { value: 'supervisor', label: 'Supervisor', hint: 'Records data' },
    { value: 'rbt', label: 'RBT', hint: 'Records data' },
    { value: 'therapist', label: 'Therapist', hint: 'Records data' },
    { value: 'staff', label: 'Staff', hint: 'Limited access' },
    { value: 'other', label: 'Other', hint: 'Records data' },
]

export default function RoleSelect({ userId, role, onChanged, compact = false, showHints = !compact }) {
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)

    // Accounts predate this list, so never assume the stored role is in it.
    // Without the placeholder the select falls back to its first option and
    // shows a role the person does not hold, which could then be saved by
    // accident.
    const current = (role || '').trim().toLowerCase()
    const isKnown = ROLES.some((r) => r.value === current)

    const handleChange = async (next) => {
        if (!next || next === current) return
        setSaving(true)
        try {
            await setUserRole(userId, next)
            onChanged?.(next)
            toast.success('Role updated')
        } catch (err) {
            toast.error(err.message || 'Could not update that role')
        } finally {
            setSaving(false)
        }
    }

    return (
        <select
            value={isKnown ? current : ''}
            disabled={saving}
            aria-label="Clinical role"
            // The therapists table opens a drawer when a row is clicked, so the
            // select must not pass its clicks upward.
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => { e.stopPropagation(); handleChange(e.target.value) }}
            className={
                compact
                    ? 'px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium bg-white text-gray-700 hover:border-[#159DB3] focus:border-[#159DB3] focus:outline-none disabled:opacity-60 cursor-pointer'
                    : 'w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-[#159DB3] focus:outline-none disabled:opacity-60'
            }
        >
            {!isKnown && (
                <option value="" disabled>
                    {role ? `${role} (not recognised)` : 'No role set'}
                </option>
            )}
            {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                    {showHints ? `${r.label} — ${r.hint}` : r.label}
                </option>
            ))}
        </select>
    )
}
