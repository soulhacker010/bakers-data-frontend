/**
 * Reports Service - Generate and download reports
 */
import api from './api'

/**
 * Get session summary report for a date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 */
export const getSessionSummary = async (dateFrom, dateTo) => {
    const response = await api.get(`/api/reports/session-summary?date_from=${dateFrom}&date_to=${dateTo}`)
    return response.data
}

/**
 * Get comprehensive client report
 * @param {number} clientId 
 */
export const getClientReport = async (clientId) => {
    const response = await api.get(`/api/reports/client/${clientId}`)
    return response.data
}

/**
 * Get monthly summary report
 * @param {number} year 
 * @param {number} month (1-12)
 */
export const getMonthlyReport = async (year, month) => {
    const response = await api.get(`/api/reports/monthly?year=${year}&month=${month}`)
    return response.data
}

/**
 * Download RAW export (one row per data point)
 */
export const downloadExport = async (options = {}) => {
    const params = new URLSearchParams()
    if (options.dateFrom) params.append('date_from', options.dateFrom)
    if (options.dateTo) params.append('date_to', options.dateTo)

    const response = await api.get(`/api/reports/export?${params.toString()}`, {
        responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `aba_raw_data_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

/**
 * Download SUMMARY export (one row per session per program with totals)
 */
export const downloadSummary = async (options = {}) => {
    const params = new URLSearchParams()
    if (options.dateFrom) params.append('date_from', options.dateFrom)
    if (options.dateTo) params.append('date_to', options.dateTo)

    const response = await api.get(`/api/reports/export-summary?${params.toString()}`, {
        responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `aba_summary_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export default {
    getSessionSummary,
    getClientReport,
    getMonthlyReport,
    downloadExport,
    downloadSummary,
}

