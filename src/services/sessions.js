/**
 * Sessions Service - CRUD operations for data collection sessions
 */
import api from './api'

/**
 * Get all sessions, optionally filtered
 * @param {Object} options - { clientId, dateFrom, dateTo, limit }
 * @returns {Array} - List of sessions
 */
export const getSessions = async (options = {}) => {
    const params = new URLSearchParams()

    if (options.clientId) {
        params.append('client_id', options.clientId)
    }
    if (options.dateFrom) {
        params.append('date_from', options.dateFrom)
    }
    if (options.dateTo) {
        params.append('date_to', options.dateTo)
    }
    if (options.limit) {
        params.append('limit', options.limit)
    }

    const response = await api.get(`/api/sessions?${params.toString()}`)
    return response.data
}

/**
 * Get a single session by ID with full details
 * @param {number} sessionId 
 * @returns {Object} - Session data with session_data
 */
export const getSession = async (sessionId) => {
    const response = await api.get(`/api/sessions/${sessionId}`)
    return response.data
}

/**
 * Start a new therapy session
 * @param {number} clientId - Client to start session for
 * @returns {Object} - Created session with details
 */
export const startSession = async (clientId) => {
    const response = await api.post('/api/sessions/start', { client_id: clientId })
    return response.data
}

/**
 * Record a data point during a session
 * @param {number} sessionId 
 * @param {Object} dataPoint - { program_id, data_type, result, prompt_level, count, duration_seconds, notes }
 * @returns {Object} - Created session data
 */
export const recordSessionData = async (sessionId, dataPoint) => {
    const response = await api.post(`/api/sessions/${sessionId}/data`, dataPoint)
    return response.data
}

/**
 * End a therapy session
 * @param {number} sessionId 
 * @param {Object} endData - { notes }
 * @returns {Object} - Completed session with summary
 */
export const endSession = async (sessionId, notes = '') => {
    const response = await api.put(`/api/sessions/${sessionId}/end`, { notes })
    return response.data
}

/**
 * Delete a session
 * @param {number} sessionId 
 */
export const deleteSession = async (sessionId) => {
    await api.delete(`/api/sessions/${sessionId}`)
}

/**
 * Edit session data (BCBA only)
 * @param {number} dataId - Session data ID
 * @param {Object} updateData - { result, prompt_level, count, duration_seconds, notes, edit_reason }
 * @returns {Object} - Updated session data
 */
export const editSessionData = async (dataId, updateData) => {
    const response = await api.put(`/api/sessions/data/${dataId}`, updateData)
    return response.data
}

export default {
    getSessions,
    getSession,
    startSession,
    recordSessionData,
    endSession,
    deleteSession,
    editSessionData,
}


