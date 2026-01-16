/**
 * API Service - Axios instance with authentication and error handling
 */
import axios from 'axios'

// API Base URL - uses Vite env variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error

        if (response) {
            // Handle specific status codes
            switch (response.status) {
                case 401:
                    // Token expired or invalid - redirect to login
                    // Skip redirect for auth endpoints (login, register, verify)
                    const isAuthEndpoint = response.config.url?.includes('/auth/login') ||
                        response.config.url?.includes('/auth/register') ||
                        response.config.url?.includes('/auth/verify');

                    if (!isAuthEndpoint) {
                        console.warn('401 Unauthorized - token expired, redirecting to login');
                        // Clear tokens and session data
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('active_session');
                        localStorage.removeItem('session_lock');

                        // Redirect to login (check if not already on login page to avoid loops)
                        if (!window.location.pathname.includes('/login')) {
                            window.location.href = '/login?expired=true';
                        }
                    }
                    break
                case 403:
                    console.error('Access forbidden:', response.config.url)
                    break
                case 404:
                    console.error('Resource not found:', response.config.url)
                    break
                case 429:
                    console.error('Rate limit exceeded')
                    break
                case 500:
                    console.error('Server error')
                    break
            }

            // Return error with message from backend
            const message = response.data?.detail || 'An error occurred'
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
