import api from './api';

/**
 * Admin service for superadmin operations
 */

export const getAdminStats = async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
};

export const getDetailedStats = async () => {
    const response = await api.get('/api/admin/detailed-stats');
    return response.data;
};

export const getProgramDetail = async (programId) => {
    const response = await api.get(`/api/admin/programs/${programId}`);
    return response.data;
};

export const getUserDetail = async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}/detail`);
    return response.data;
};

export const getClientDetail = async (clientId) => {
    const response = await api.get(`/api/admin/clients/${clientId}/detail`);
    return response.data;
};

export const getAllUsers = async (statusFilter = null) => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const response = await api.get('/api/admin/users', { params });
    return response.data;
};

export const getPendingUsers = async () => {
    const response = await api.get('/api/admin/users/pending');
    return response.data;
};

export const approveUser = async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/approve`);
    return response.data;
};

export const rejectUser = async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/reject`);
    return response.data;
};

export const deactivateUser = async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/deactivate`);
    return response.data;
};

export const activateUser = async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/activate`);
    return response.data;
};

export const deleteUser = async (userId, hard = false) => {
    const response = await api.delete(`/api/admin/users/${userId}`, { params: { hard } });
    return response.data;
};

export const getAllClients = async () => {
    const response = await api.get('/api/admin/clients');
    return response.data;
};

export const toggleAdmin = async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/toggle-admin`);
    return response.data;
};

export const getAuditLogs = async (params = {}) => {
    const response = await api.get('/api/admin/audit-logs', { params });
    return response.data;
};

export const getAuditLogDetail = async (logId) => {
    const response = await api.get(`/api/admin/audit-logs/${logId}`);
    return response.data;
};

export default {
    getAdminStats,
    getDetailedStats,
    getProgramDetail,
    getUserDetail,
    getClientDetail,
    getAllUsers,
    getPendingUsers,
    approveUser,
    rejectUser,
    deactivateUser,
    activateUser,
    deleteUser,
    getAllClients,
    getAuditLogs,
    getAuditLogDetail,
    toggleAdmin,
};
