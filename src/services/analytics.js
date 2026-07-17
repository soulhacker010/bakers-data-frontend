/**
 * Analytics Service - Dashboard stats and progress data
 */
import api from './api'

/**
 * Get dashboard statistics
 * Note: No dedicated dashboard endpoint, we aggregate from multiple sources
 * @returns {Object} - { total_clients, active_programs, sessions_this_month, ... }
 */
export const getDashboardStats = async () => {
    // Get clients to count
    const clientsRes = await api.get('/api/clients')
    const clients = clientsRes.data

    // Get recent sessions
    const sessionsRes = await api.get('/api/sessions?limit=50')
    const sessions = sessionsRes.data

    // Calculate stats
    const now = new Date()
    const thisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.start_time)
        return sessionDate.getMonth() === now.getMonth() &&
            sessionDate.getFullYear() === now.getFullYear()
    })

    return {
        total_clients: clients.length,
        sessions_this_month: thisMonth.length,
        recent_sessions: sessions.slice(0, 5)
    }
}

/**
 * Get client progress/analytics
 * @param {number} clientId 
 * @param {Object} options - { startDate, endDate }
 * @returns {Object} - Client analytics data
 */
export const getClientProgress = async (clientId, options = {}) => {
    const params = new URLSearchParams()

    if (options.startDate) {
        params.append('date_from', options.startDate)
    }
    if (options.endDate) {
        params.append('date_to', options.endDate)
    }

    const response = await api.get(`/api/analytics/clients/${clientId}?${params.toString()}`)
    return response.data
}

/**
 * Get program progress
 * @param {number} programId
 * @param {Object} options - { dateFrom, dateTo, targetId }
 * @returns {Object} - Program analytics data
 */
export const getProgramProgress = async (programId, options = {}) => {
    const params = new URLSearchParams()

    if (options.dateFrom) {
        params.append('date_from', options.dateFrom)
    }
    if (options.dateTo) {
        params.append('date_to', options.dateTo)
    }
    if (options.targetId != null && options.targetId !== '') {
        params.append('target_id', options.targetId)
    }

    const response = await api.get(`/api/analytics/programs/${programId}?${params.toString()}`)
    return response.data
}

/**
 * Get mastery progress for all programs of a client
 * @param {number} clientId 
 * @returns {Object} - Mastery progress data for each program
 */
export const getMasteryProgress = async (clientId) => {
    const response = await api.get(`/api/analytics/mastery/${clientId}`)
    return response.data
}

/**
 * Download a program's session data as CSV (the Progress page's Export).
 * Goes through the authenticated api client — a plain window.open() cannot
 * send the auth token and, on Vercel, a relative /api URL is swallowed by
 * the SPA rewrite and renders the app's 404 page instead.
 * @param {number|string} programId
 * @param {string} [programName] - used to build a readable filename
 */
export const exportProgramData = async (programId, programName = 'program') => {
    const response = await api.get(`/api/analytics/export?program_id=${programId}`, {
        responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const slug = String(programName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'program'
    link.setAttribute('download', `${slug}_data_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export default {
    getDashboardStats,
    getClientProgress,
    getProgramProgress,
    getMasteryProgress,
    exportProgramData,
}
