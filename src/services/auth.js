/**
 * Authentication Service - Login, Register, User management
 */
import api, { setToken, removeToken } from './api'

/**
 * Register a new user
 * @param {Object} userData - { email, password, full_name, role }
 */
export const register = async (userData) => {
    // userData contains { email, password, full_name, turnstile_token }
    const response = await api.post('/api/auth/register', userData)
    return response.data
}

/**
 * Login user and store token
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} - { access_token, token_type, user }
 */
export const login = async (credentials) => {
    // credentials contains { email, password, turnstile_token }
    const response = await api.post('/api/auth/login', credentials)
    const { access_token, user } = response.data

    if (access_token) {
        setToken(access_token)
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        }
    }
    return response.data
}

/**
 * Logout user - clear stored data
 */
export const logout = () => {
    removeToken()
    localStorage.removeItem('user')
}

/**
 * Get current authenticated user
 * @returns {Object} - User data
 */
export const getCurrentUser = async () => {
    const response = await api.get('/api/auth/me')
    return response.data
}

/**
 * Get stored user from localStorage
 * @returns {Object|null}
 */
export const getStoredUser = () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token')
}

export const validateCode = async (email, code) => {
    const response = await api.post('/api/auth/validate-code', { email, code })
    return response.data
}

export const verifyCode = async (email, code) => {
    const response = await api.post('/api/auth/verify-code', { email, code })
    return response.data
}

export const resendCode = async (email) => {
    const response = await api.post('/api/auth/resend-code', { email })
    return response.data
}

export const forgotPassword = async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
}

export const resetPassword = async (email, code, new_password) => {
    const response = await api.post('/api/auth/reset-password', { email, code, new_password })
    return response.data
}

export default {
    register,
    login,
    logout,
    getCurrentUser,
    getStoredUser,
    isAuthenticated,
}
