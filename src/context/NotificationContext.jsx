/**
 * Notification Context - Manages app notifications with localStorage persistence
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificationContext = createContext()

// Notification types
export const NOTIFICATION_TYPES = {
    SESSION_COMPLETED: 'session_completed',
    CLIENT_ADDED: 'client_added',
    PROGRAM_CREATED: 'program_created',
    TARGET_MASTERED: 'target_mastered',
    STAFF_ASSIGNED: 'staff_assigned',
    WELLNESS_ALERT: 'wellness_alert'
}

const STORAGE_KEY = 'aba_notifications'
const MAX_AGE_DAYS = 7

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    // Load notifications from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                // Filter out old notifications (> 7 days)
                const cutoff = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
                const filtered = parsed.filter(n => n.timestamp > cutoff)
                setNotifications(filtered)
                // Update storage if we filtered any
                if (filtered.length !== parsed.length) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
                }
            } catch (e) {
                console.error('Failed to parse notifications:', e)
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    }, [])

    // Save to localStorage whenever notifications change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    }, [notifications])

    // Add a new notification
    const addNotification = useCallback((type, message, data = {}) => {
        const newNotification = {
            id: Date.now(),
            type,
            message,
            data,
            timestamp: Date.now(),
            read: false
        }
        setNotifications(prev => [newNotification, ...prev])
    }, [])

    // Mark notification as read
    const markRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }, [])

    // Mark all as read
    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markRead,
            markAllRead,
            clearAll,
            NOTIFICATION_TYPES
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}

export default NotificationContext
