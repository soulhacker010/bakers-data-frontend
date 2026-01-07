/**
 * Clients Service - CRUD operations for clients
 */
import api from './api'

/**
 * Get all clients for the current user
 * @param {Object} options - { isActive, search }
 * @returns {Array} - List of clients
 */
export const getClients = async (options = {}) => {
    const params = new URLSearchParams()

    if (options.isActive !== undefined) {
        params.append('is_active', options.isActive)
    }
    if (options.search) {
        params.append('search', options.search)
    }

    const response = await api.get(`/api/clients?${params.toString()}`)
    return response.data
}

/**
 * Get a single client by ID
 * @param {number} clientId 
 * @returns {Object} - Client data
 */
export const getClient = async (clientId) => {
    const response = await api.get(`/api/clients/${clientId}`)
    return response.data
}

/**
 * Create a new client
 * @param {Object} clientData - { first_name, last_name, date_of_birth, diagnosis, notes }
 * @returns {Object} - Created client
 */
export const createClient = async (clientData) => {
    const response = await api.post('/api/clients', clientData)
    return response.data
}

/**
 * Update an existing client
 * @param {number} clientId 
 * @param {Object} clientData 
 * @returns {Object} - Updated client
 */
export const updateClient = async (clientId, clientData) => {
    const response = await api.put(`/api/clients/${clientId}`, clientData)
    return response.data
}

/**
 * Delete a client (soft delete)
 * @param {number} clientId 
 */
export const deleteClient = async (clientId) => {
    await api.delete(`/api/clients/${clientId}`)
}

export default {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
}
