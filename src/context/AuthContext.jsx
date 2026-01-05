import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Mock user for development (no backend connection yet)
const mockUser = {
    id: 1,
    email: 'therapist@example.com',
    full_name: 'John Doe',
    created_at: '2024-01-15T10:30:00Z'
}

export function AuthProvider({ children }) {
    // DEV MODE: Auto-login with mock user (no auth required)
    const [user, setUser] = useState(mockUser)
    const [token, setToken] = useState('dev-mode-token')

    const login = async (email, password) => {
        // Mock login - will connect to backend later
        const fakeToken = 'mock-jwt-token-' + Date.now()
        localStorage.setItem('auth_token', fakeToken)
        setToken(fakeToken)
        setUser({ ...mockUser, email })
        return true
    }

    const register = async (fullName, email, password) => {
        // Mock register - will connect to backend later
        const fakeToken = 'mock-jwt-token-' + Date.now()
        localStorage.setItem('auth_token', fakeToken)
        setToken(fakeToken)
        setUser({ ...mockUser, email, full_name: fullName })
        return true
    }

    const logout = () => {
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
    }

    // DEV MODE: Always authenticated
    const isAuthenticated = true

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated }}>
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
