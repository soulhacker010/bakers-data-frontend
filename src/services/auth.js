/**
 * Authentication Service - Login, Register, User management
 */
import api, { setToken, removeToken } from './api'

// Device token storage for OTP bypass
const DEVICE_TOKEN_KEY = 'device_token'

export const getDeviceToken = () => localStorage.getItem(DEVICE_TOKEN_KEY)
export const setDeviceToken = (token) => localStorage.setItem(DEVICE_TOKEN_KEY, token)
export const removeDeviceToken = () => localStorage.removeItem(DEVICE_TOKEN_KEY)

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
 * Login user - may return token OR otp_required
 * @param {Object} credentials - { email, password, turnstile_token }
 * @returns {Object} - { access_token, user } OR { otp_required, message, email_masked }
 */
export const login = async (credentials) => {
    // Include device_token for trusted device check
    const device_token = getDeviceToken()
    const payload = { ...credentials, device_token }

    const response = await api.post('/api/auth/login', payload)
    const data = response.data

    // If OTP is required, return the response without setting token
    if (data.otp_required) {
        return data
    }

    // Normal login - set token and user
    const { access_token, user } = data
    if (access_token) {
        setToken(access_token)
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        }
    }
    return data
}

/**
 * Verify login OTP code (Step 2 of 2FA login)
 * @param {string} email 
 * @param {string} code - 6-digit OTP
 * @param {boolean} rememberDevice - If true, skip OTP for 30 days
 * @returns {Object} - { access_token, user, device_token? }
 */
export const verifyLoginOTP = async (email, code, rememberDevice = false) => {
    const response = await api.post('/api/auth/login/verify-otp', {
        email,
        code,
        remember_device: rememberDevice
    })

    const data = response.data

    // Set access token
    if (data.access_token) {
        setToken(data.access_token)
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user))
        }
    }

    // Store device token if provided (for trusted device bypass)
    if (data.device_token) {
        setDeviceToken(data.device_token)
    }

    return data
}

/**
 * Resend login OTP code
 * @param {string} email
 */
export const resendLoginOTP = async (email) => {
    const response = await api.post('/api/auth/login/resend-otp', { email })
    return response.data
}

/**
 * Toggle OTP (2FA) for current user
 */
export const toggleOTP = async () => {
    const response = await api.post('/api/auth/otp/toggle')
    return response.data
}

/**
 * Get list of trusted devices
 */
export const getTrustedDevices = async () => {
    const response = await api.get('/api/auth/otp/devices')
    return response.data
}

/**
 * Remove a trusted device
 * @param {number} deviceId
 */
export const removeTrustedDevice = async (deviceId) => {
    const response = await api.delete(`/api/auth/otp/devices/${deviceId}`)
    return response.data
}

/**
 * Remove all trusted devices
 */
export const removeAllTrustedDevices = async () => {
    const response = await api.delete('/api/auth/otp/devices')
    return response.data
}

/**
 * Logout user - clear stored data
 */
export const logout = () => {
    removeToken()
    localStorage.removeItem('user')
    // Don't remove device_token - keep trusted device status
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

/**
 * Change password for authenticated user
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
    })
    return response.data
}

export default {
    register,
    login,
    logout,
    getCurrentUser,
    getStoredUser,
    isAuthenticated,
    verifyLoginOTP,
    resendLoginOTP,
    toggleOTP,
    getTrustedDevices,
    removeTrustedDevice,
    removeAllTrustedDevices,
    changePassword
}
