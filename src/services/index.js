/**
 * Services Index - Export all API services
 */

export { default as api, getToken, setToken, removeToken } from './api'
export { default as authService, login, logout, register, getCurrentUser, getStoredUser, isAuthenticated } from './auth'
export { default as clientsService, getClients, getClient, createClient, updateClient, deleteClient } from './clients'
export { default as programsService, getPrograms, getProgram, createProgram, updateProgram, deleteProgram } from './programs'
export { getTargets, getTarget, createTarget, updateTarget, deleteTarget, reorderTarget } from './targets'
export { getTaskSteps, getTaskStep, createTaskStep, updateTaskStep, deleteTaskStep, reorderTaskSteps } from './taskSteps'
export { getMyRole, getStaffMembers, getClientAssignments, assignStaffToClient, bulkAssignStaff, removeAssignment } from './staff'
export { default as sessionsService, getSessions, getSession, createSession, updateSession, completeSession, addSessionData, deleteSession } from './sessions'
export { default as analyticsService, getDashboardStats, getClientProgress, getProgramProgress } from './analytics'
export { default as reportsService, getSessionSummary, getClientReport, getMonthlyReport, exportAllData, downloadExport } from './reports'



