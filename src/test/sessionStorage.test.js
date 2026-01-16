/**
 * Tests for sessionStorage utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    saveActiveSession,
    getActiveSession,
    clearActiveSession,
    acquireSessionLock
} from '../utils/sessionStorage'

describe('sessionStorage utilities', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        vi.clearAllMocks()
    })

    describe('saveActiveSession', () => {
        it('should save session data to localStorage', () => {
            saveActiveSession(123, 456)

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'active_session',
                expect.stringContaining('"sessionId":123')
            )
        })
    })

    describe('getActiveSession', () => {
        it('should return null when no session exists', () => {
            localStorage.getItem.mockReturnValue(null)

            const result = getActiveSession()

            expect(result).toBeNull()
        })

        it('should return session data when valid session exists', () => {
            const mockSession = {
                sessionId: 123,
                clientId: 456,
                timestamp: Date.now(),
                tabId: 'test_tab'
            }
            localStorage.getItem.mockReturnValue(JSON.stringify(mockSession))

            const result = getActiveSession()

            expect(result).toEqual(mockSession)
        })

        it('should clear and return null for expired sessions', () => {
            const oldSession = {
                sessionId: 123,
                clientId: 456,
                timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
                tabId: 'test_tab'
            }
            localStorage.getItem.mockReturnValue(JSON.stringify(oldSession))

            const result = getActiveSession()

            expect(result).toBeNull()
            expect(localStorage.removeItem).toHaveBeenCalled()
        })
    })

    describe('clearActiveSession', () => {
        it('should remove session and lock from localStorage', () => {
            clearActiveSession()

            expect(localStorage.removeItem).toHaveBeenCalledWith('active_session')
            expect(localStorage.removeItem).toHaveBeenCalledWith('session_lock')
        })
    })

    describe('acquireSessionLock', () => {
        it('should save lock data to localStorage', () => {
            acquireSessionLock(123)

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'session_lock',
                expect.stringContaining('"sessionId":123')
            )
        })
    })
})
