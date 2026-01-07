/**
 * Staff Service - Manage staff members and client assignments
 */
import api from './api'

/**
 * Get user's role
 * @returns {Object} - User role info { id, email, full_name, role }
 */
export const getMyRole = async () => {
    const response = await api.get('/api/staff/my-role')
    return response.data
}

/**
 * Get all staff members (BCBAs only)
 * @returns {Array} - List of staff members
 */
export const getStaffMembers = async () => {
    const response = await api.get('/api/staff/staff')
    return response.data
}

/**
 * Get staff assigned to a client
 * @param {number} clientId - Client ID
 * @returns {Array} - List of assignments
 */
export const getClientAssignments = async (clientId) => {
    const response = await api.get(`/api/staff/assignments/client/${clientId}`)
    return response.data
}

/**
 * Assign a staff member to a client
 * @param {number} staffId - Staff member ID
 * @param {number} clientId - Client ID
 * @returns {Object} - Assignment object
 */
export const assignStaffToClient = async (staffId, clientId) => {
    const response = await api.post('/api/staff/assignments', { staff_id: staffId, client_id: clientId })
    return response.data
}

/**
 * Bulk assign staff to a client (replaces existing assignments)
 * @param {number} clientId - Client ID
 * @param {Array} staffIds - Array of staff member IDs
 * @returns {Array} - List of assignments
 */
export const bulkAssignStaff = async (clientId, staffIds) => {
    const response = await api.post(`/api/staff/assignments/client/${clientId}/bulk`, { staff_ids: staffIds })
    return response.data
}

/**
 * Remove a staff assignment
 * @param {number} assignmentId - Assignment ID
 */
export const removeAssignment = async (assignmentId) => {
    await api.delete(`/api/staff/assignments/${assignmentId}`)
}
