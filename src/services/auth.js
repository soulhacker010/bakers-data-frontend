/**
 * Authentication Service - Login, Register, User management
 */
import api, { setToken, removeToken } from './api'

/**
 * Register a new user
 * @param {Object} userData - { email, password, full_name, role }
 */
export const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
}

/**
 * Login user and store token
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} - { access_token, token_type, user }
 */
export const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    const { access_token, user } = response.data

    // Store token and user
    setToken(access_token)
    localStorage.setItem('user', JSON.stringify(user))

    return { token: access_token, user }
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

export default {
    register,
    login,
    logout,
    getCurrentUser,
    getStoredUser,
    isAuthenticated,
}
