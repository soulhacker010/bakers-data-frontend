/**
 * StaffAssignmentModal - Modal for BCBAs to assign staff to clients
 */
import { useState, useEffect } from 'react'
import { getStaffMembers, getClientAssignments, bulkAssignStaff } from '../../services/staff'
import { X, User, Check, Loader2, Users } from 'lucide-react'

export default function StaffAssignmentModal({ clientId, clientName, onClose, onSaved }) {
    const [staffMembers, setStaffMembers] = useState([])
    const [assignments, setAssignments] = useState([])
    const [selectedStaff, setSelectedStaff] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [staff, existing] = await Promise.all([
                    getStaffMembers(),
                    getClientAssignments(clientId)
                ])
                setStaffMembers(staff)
                setAssignments(existing)
                // Pre-select existing assignments
                setSelectedStaff(existing.map(a => a.staff_id))
            } catch (err) {
                console.error('Failed to load staff data:', err)
                setError('Failed to load staff members')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [clientId])

    const toggleStaff = (staffId) => {
        setSelectedStaff(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        )
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await bulkAssignStaff(clientId, selectedStaff)
            onSaved?.()
            onClose()
        } catch (err) {
            console.error('Failed to save assignments:', err)
            setError('Failed to save assignments')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-[#159DB3] to-[#0D7C8C]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="text-white" size={24} />
                            <div>
                                <h2 className="text-xl font-bold text-white">Assign Staff</h2>
                                <p className="text-white/70 text-sm">{clientName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white p-1"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-[#159DB3] mx-auto" />
                            <p className="text-gray-500 mt-2">Loading staff members...</p>
                        </div>
                    ) : staffMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <User size={48} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">No users available to assign</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">
                                Select users who can access this client:
                            </p>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {staffMembers.map(staff => (
                                    <button
                                        key={staff.id}
                                        onClick={() => toggleStaff(staff.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedStaff.includes(staff.id)
                                                ? 'border-[#159DB3] bg-[#E0F4F7]'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedStaff.includes(staff.id)
                                                ? 'bg-[#159DB3] text-white'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {selectedStaff.includes(staff.id)
                                                ? <Check size={20} />
                                                : <User size={20} />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{staff.full_name}</p>
                                            <p className="text-xs text-gray-500">{staff.email} · <span className="text-[#159DB3] font-medium">{staff.role || 'User'}</span></p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-1 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#0D7C8C] transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : `Assign ${selectedStaff.length} Staff`}
                    </button>
                </div>
            </div>
        </div>
    )
}
