import api from './api'

/**
 * Phase change lines: the vertical markers a clinician places on a program's
 * graph to show where the approach changed.
 */

export const getPhaseLines = async (programId) => {
    const response = await api.get(`/api/programs/${programId}/phase-lines`)
    return response.data
}

/** @param {Object} line - { date, title, notes? } */
export const createPhaseLine = async (programId, line) => {
    const response = await api.post(`/api/programs/${programId}/phase-lines`, line)
    return response.data
}

/** Fields left out are untouched, so a title can be corrected without moving the line. */
export const updatePhaseLine = async (lineId, changes) => {
    const response = await api.put(`/api/phase-lines/${lineId}`, changes)
    return response.data
}

export const deletePhaseLine = async (lineId) => {
    await api.delete(`/api/phase-lines/${lineId}`)
}

export default { getPhaseLines, createPhaseLine, updatePhaseLine, deletePhaseLine }
