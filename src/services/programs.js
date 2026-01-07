/**
 * Programs Service - CRUD operations for therapy programs
 */
import api from './api'

/**
 * Get all programs, optionally filtered by client
 * @param {Object} options - { clientId or client_id, isActive }
 * @returns {Array} - List of programs
 */
export const getPrograms = async (options = {}) => {
    // Support both clientId and client_id
    const clientId = options.clientId || options.client_id

    // If client ID is specified, use the client-specific endpoint
    if (clientId) {
        const response = await api.get(`/api/programs/client/${clientId}`)
        return response.data
    }

    // Otherwise get all programs
    const response = await api.get('/api/programs')
    return response.data
}

/**
 * Get a single program by ID
 * @param {number} programId 
 * @returns {Object} - Program data
 */
export const getProgram = async (programId) => {
    const response = await api.get(`/api/programs/${programId}`)
    return response.data
}

/**
 * Create a new program for a client
 * @param {number} clientId - Client ID
 * @param {Object} programData - { name, program_type, data_type, description, mastery_criteria }
 * @returns {Object} - Created program
 */
export const createProgram = async (clientId, programData) => {
    const response = await api.post(`/api/programs/client/${clientId}`, programData)
    return response.data
}

/**
 * Update an existing program
 * @param {number} programId 
 * @param {Object} programData 
 * @returns {Object} - Updated program
 */
export const updateProgram = async (programId, programData) => {
    const response = await api.put(`/api/programs/${programId}`, programData)
    return response.data
}

/**
 * Delete a program (soft delete)
 * @param {number} programId 
 */
export const deleteProgram = async (programId) => {
    await api.delete(`/api/programs/${programId}`)
}

export default {
    getPrograms,
    getProgram,
    createProgram,
    updateProgram,
    deleteProgram,
}
