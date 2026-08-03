/**
 * Wellness Service - pediatric check-in endpoints
 */
import api from './api'

/**
 * Active statements for the mood's routing band.
 * @param {number} moodScore 1-4
 */
export const getStatementsForMood = async (moodScore) => {
    const response = await api.get(`/api/wellness/statements?mood_score=${moodScore}`)
    return response.data
}

/**
 * Active choices for the "What would help right now?" screen (data-driven so
 * locations can hide options they don't offer).
 */
export const getSupportOptions = async () => {
    const response = await api.get('/api/wellness/support-options')
    return response.data
}

/**
 * Record one completed child check-in.
 * @param {Object} payload - { client_id, session_id, mood_score, statement_id, statement_response, support_requested }
 */
export const recordCheckin = async (payload) => {
    const response = await api.post('/api/wellness/checkins', payload)
    return response.data
}

/** History + chart series + support counts for one client. */
export const getClientWellness = async (clientId) => {
    const response = await api.get(`/api/wellness/clients/${clientId}`)
    return response.data
}

/** Check-ins attached to one session. */
export const getSessionWellness = async (sessionId) => {
    const response = await api.get(`/api/wellness/sessions/${sessionId}`)
    return response.data
}

/** Recent flagged check-ins for clients this user can access. */
export const getAttention = async () => {
    const response = await api.get('/api/wellness/attention')
    return response.data
}

export default {
    getStatementsForMood,
    getSupportOptions,
    recordCheckin,
    getClientWellness,
    getSessionWellness,
    getAttention,
}
