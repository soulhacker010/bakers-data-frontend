/**
 * API Service - Axios instance with authentication, token refresh, and error handling.
 * 
 * Key production features:
 * - Silent token refresh every 30 minutes to prevent mid-session logout
 * - Automatic retry on 401 (tries refresh before giving up)
 * - Per-request retry on 429 (rate limit) with backoff
 */
import axios from 'axios'

// API Base URL - uses Vite env variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const isDev = import.meta.env.DEV

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
})

// Token management
export const getToken = () => localStorage.getItem('access_token')
export const setToken = (token) => localStorage.setItem('access_token', token)
export const removeToken = () => localStorage.removeItem('access_token')

// Token refresh state (prevent concurrent refresh calls)
let isRefreshing = false
let refreshPromise = null
let refreshIntervalId = null

/**
 * Silently refresh the access token.
 * Returns the new token or null if refresh failed.
 */
const silentRefresh = async () => {
    const currentToken = getToken()
    if (!currentToken) return null

    // Deduplicate concurrent refresh calls
    if (isRefreshing) return refreshPromise

    isRefreshing = true
    refreshPromise = (async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/refresh`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            )
            const newToken = response.data.access_token
            if (newToken) {
                setToken(newToken)
                // Update stored user data if provided
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user))
                }
                return newToken
            }
            return null
        } catch (err) {
            if (isDev) {
                console.warn('Token refresh failed:', err.response?.status)
            }
            return null
        } finally {
            isRefreshing = false
            refreshPromise = null
        }
    })()

    return refreshPromise
}

/**
 * Start periodic token refresh (every 30 minutes).
 * Call this after successful login.
 */
export const startTokenRefresh = () => {
    stopTokenRefresh() // Clear any existing interval
    
    // Refresh every 30 minutes
    refreshIntervalId = setInterval(() => {
        if (getToken()) {
            silentRefresh()
        }
    }, 30 * 60 * 1000)
}

/**
 * Stop periodic token refresh.
 * Call this on logout.
 */
export const stopTokenRefresh = () => {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId)
        refreshIntervalId = null
    }
}

// Auto-start refresh if token exists on page load
if (getToken()) {
    startTokenRefresh()
}

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - Handle errors globally with retry logic
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response, config } = error

        if (response) {
            switch (response.status) {
                case 401: {
                    // Skip refresh for auth endpoints
                    const isAuthEndpoint = config.url?.includes('/auth/login') ||
                        config.url?.includes('/auth/register') ||
                        config.url?.includes('/auth/verify') ||
                        config.url?.includes('/auth/refresh');

                    // Try silent refresh once before giving up (don't retry if already retried)
                    if (!isAuthEndpoint && !config._retried401) {
                        config._retried401 = true
                        const newToken = await silentRefresh()
                        if (newToken) {
                            // Retry the original request with the new token
                            config.headers.Authorization = `Bearer ${newToken}`
                            return api(config)
                        }
                    }

                    // Refresh failed or already retried - logout
                    if (!isAuthEndpoint) {
                        if (isDev) {
                            console.warn('401 Unauthorized - token expired, redirecting to login');
                        }
                        stopTokenRefresh()
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user');
                        sessionStorage.removeItem('active_session');
                        localStorage.removeItem('session_lock');

                        if (!window.location.pathname.includes('/login')) {
                            window.location.href = '/login?expired=true';
                        }
                    }
                    break
                }
                case 429: {
                    // Rate limited - retry once after delay for session data endpoints
                    if (!config._retried429 && config.url?.includes('/sessions')) {
                        config._retried429 = true
                        const retryAfter = parseInt(response.headers['retry-after'] || '3', 10)
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
                        return api(config)
                    }
                    if (isDev) {
                        console.error('Rate limit exceeded')
                    }
                    break
                }
                case 403:
                    if (isDev) {
                        console.error('Access forbidden:', config.url)
                    }
                    break
                case 404:
                    if (isDev) {
                        console.error('Resource not found:', config.url)
                    }
                    break
                case 500:
                    if (isDev) {
                        console.error('Server error')
                    }
                    break
            }

            // Extract readable error message from backend response
            let message = 'An error occurred'

            const detail = response.data?.detail

            if (typeof detail === 'string') {
                // Simple string error
                message = detail
            } else if (Array.isArray(detail)) {
                // Pydantic validation errors - format: [{ loc: [...], msg: "...", type: "..." }]
                const errors = detail.map(err => {
                    const field = err.loc?.[err.loc.length - 1] || 'field'
                    return `${field}: ${err.msg}`
                }).join(', ')
                message = errors || 'Validation error'
            } else if (typeof detail === 'object' && detail !== null) {
                // Object error - try to extract message
                message = detail.msg || detail.message || detail.error || JSON.stringify(detail)
            } else if (response.data?.message) {
                // Fallback to message field
                message = response.data.message
            }

            return Promise.reject(new Error(message))
        }

        // Network error
        if (error.request) {
            return Promise.reject(new Error('Network error. Please check your connection.'))
        }

        return Promise.reject(error)
    }
)

export default api
