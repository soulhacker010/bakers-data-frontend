import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
    login as apiLogin,
    logout as apiLogout,
    register as apiRegister,
    getCurrentUser,
    getStoredUser,
    isAuthenticated as checkAuth
} from '../services/auth'
import { useIdleTimeout } from '../hooks/useIdleTimeout'

const AuthContext = createContext(null)

// Session timeout duration (15 minutes for HIPAA compliance)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sessionExpired, setSessionExpired] = useState(false)

    /**
     * Logout the current user
     */
    const logout = useCallback((expired = false) => {
        apiLogout()
        setUser(null)
        if (expired) {
            setSessionExpired(true)
        }
    }, [])

    // HIPAA: Auto-logout after 15 minutes of inactivity
    const handleIdleTimeout = useCallback(() => {
        if (user) {
            console.log('Session timeout: Logging out due to inactivity')
            logout(true)
        }
    }, [user, logout])

    // Only enable idle timeout when user is logged in
    useIdleTimeout(handleIdleTimeout, user ? SESSION_TIMEOUT_MS : null)

    // Check for existing auth on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if we have a stored user
                const storedUser = getStoredUser()
                if (storedUser && checkAuth()) {
                    // Verify token is still valid by fetching current user
                    try {
                        const currentUser = await getCurrentUser()
                        setUser(currentUser)
                        // Update stored user with fresh data
                        localStorage.setItem('user', JSON.stringify(currentUser))
                    } catch (err) {
                        // Token invalid, clear everything
                        apiLogout()
                        setUser(null)
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err)
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    /**
     * Login with email and password
     */
    const login = async (email, password) => {
        setError(null)
        setSessionExpired(false)
        try {
            const { user: loggedInUser } = await apiLogin(email, password)
            setUser(loggedInUser)
            return true
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    /**
     * Register a new account
     */
    const register = async (fullName, email, password, role = 'Therapist') => {
        setError(null)
        try {
            // Register the user
            await apiRegister({
                full_name: fullName,
                email: email,
                password: password,
                role: role // Use the selected role
            })

            // Auto-login after registration
            const { user: loggedInUser } = await apiLogin(email, password)
            setUser(loggedInUser)
            return true
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    /**
     * Clear session expired flag (for showing message once)
     */
    const clearSessionExpired = () => {
        setSessionExpired(false)
    }

    // Computed auth state
    const isAuthenticated = !!user

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            register,
            logout: () => logout(false),
            isAuthenticated,
            sessionExpired,
            clearSessionExpired,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
