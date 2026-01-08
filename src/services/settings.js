/**
 * Settings Service - User profile and preferences management
 */
import api from './api'

/**
 * Get current user profile
 */
export const getUserProfile = async () => {
    const response = await api.get('/api/users/me')
    return response.data
}

/**
 * Update user profile
 * @param {Object} data - { full_name, email }
 */
export const updateUserProfile = async (data) => {
    const response = await api.put('/api/users/me', data)
    return response.data
}

/**
 * Get user settings (therapy defaults, notification preferences)
 */
export const getUserSettings = async () => {
    const response = await api.get('/api/users/settings')
    return response.data
}

/**
 * Update user settings
 * @param {Object} settings - Settings to update
 */
export const updateUserSettings = async (settings) => {
    const response = await api.put('/api/users/settings', settings)
    return response.data
}

/**
 * Export all user data (clients, programs, sessions)
 */
export const exportAllData = async () => {
    const response = await api.get('/api/users/export')
    return response.data
}

/**
 * Download data as JSON file
 */
export const downloadDataExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return data
}

export default {
    getUserProfile,
    updateUserProfile,
    getUserSettings,
    updateUserSettings,
    exportAllData,
    downloadDataExport
}
