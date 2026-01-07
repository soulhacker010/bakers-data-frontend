/**
 * TaskSteps Service - CRUD operations for Task Analysis steps
 */
import api from './api'

/**
 * Get all steps for a program
 * @param {number} programId - Program ID
 * @returns {Array} - List of steps
 */
export const getTaskSteps = async (programId) => {
    const response = await api.get(`/api/task-steps/program/${programId}`)
    return response.data
}

/**
 * Get a single step by ID
 * @param {number} stepId - Step ID
 * @returns {Object} - Step data
 */
export const getTaskStep = async (stepId) => {
    const response = await api.get(`/api/task-steps/${stepId}`)
    return response.data
}

/**
 * Create a new step for a program
 * @param {number} programId - Program ID
 * @param {Object} stepData - Step data { name, description, position }
 * @returns {Object} - Created step
 */
export const createTaskStep = async (programId, stepData) => {
    const response = await api.post(`/api/task-steps/program/${programId}`, stepData)
    return response.data
}

/**
 * Update an existing step
 * @param {number} stepId - Step ID
 * @param {Object} stepData - Fields to update
 * @returns {Object} - Updated step
 */
export const updateTaskStep = async (stepId, stepData) => {
    const response = await api.put(`/api/task-steps/${stepId}`, stepData)
    return response.data
}

/**
 * Delete a step
 * @param {number} stepId - Step ID
 */
export const deleteTaskStep = async (stepId) => {
    await api.delete(`/api/task-steps/${stepId}`)
}

/**
 * Reorder steps
 * @param {number} programId - Program ID
 * @param {Array} stepIds - Array of step IDs in new order
 * @returns {Array} - Updated steps
 */
export const reorderTaskSteps = async (programId, stepIds) => {
    const response = await api.post(`/api/task-steps/program/${programId}/reorder`, stepIds)
    return response.data
}
