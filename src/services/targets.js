/**
 * Targets Service - CRUD operations for program targets
 */
import api from './api'

/**
 * Get all targets for a program
 * @param {number} programId - Program ID
 * @returns {Array} - List of targets
 */
export const getTargets = async (programId) => {
    const response = await api.get(`/api/targets/program/${programId}`)
    return response.data
}

/**
 * Get a single target by ID
 * @param {number} targetId - Target ID
 * @returns {Object} - Target data
 */
export const getTarget = async (targetId) => {
    const response = await api.get(`/api/targets/${targetId}`)
    return response.data
}

/**
 * Create a new target for a program
 * @param {number} programId - Program ID
 * @param {Object} targetData - Target data { name, description, mastery_criteria, mastery_threshold, mastery_consecutive_sessions }
 * @returns {Object} - Created target
 */
export const createTarget = async (programId, targetData) => {
    const response = await api.post(`/api/targets/program/${programId}`, targetData)
    return response.data
}

/**
 * Update an existing target
 * @param {number} targetId - Target ID
 * @param {Object} targetData - Fields to update
 * @returns {Object} - Updated target
 */
export const updateTarget = async (targetId, targetData) => {
    const response = await api.put(`/api/targets/${targetId}`, targetData)
    return response.data
}

/**
 * Delete a target (soft delete)
 * @param {number} targetId - Target ID
 */
export const deleteTarget = async (targetId) => {
    await api.delete(`/api/targets/${targetId}`)
}

/**
 * Reorder a target's position
 * @param {number} targetId - Target ID
 * @param {number} newPosition - New position
 * @returns {Object} - Updated target
 */
export const reorderTarget = async (targetId, newPosition) => {
    const response = await api.post(`/api/targets/${targetId}/reorder?new_position=${newPosition}`)
    return response.data
}
