/**
 * Where a running session is remembered, and where the lock on it lives.
 *
 * These two deliberately use different storage, and the split is the whole
 * point of the module:
 *
 *   the session  -> sessionStorage, which is per tab. Two tabs open on the
 *                   same practice are two different people at two different
 *                   tables, and one must not resume the other's session.
 *   the lock     -> localStorage, which is shared across tabs. It only works
 *                   as a lock if every tab can see it.
 *
 * These tests asserted on localStorage for both and had been failing since
 * August, long enough that four red results had stopped meaning anything and
 * a real failure could have hidden among them.
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
        it('keeps the session in this tab only', () => {
            saveActiveSession(123, 456)

            expect(sessionStorage.setItem).toHaveBeenCalledWith(
                'active_session',
                expect.stringContaining('"sessionId":123')
            )
        })

        it('does not put the session where other tabs would find it', () => {
            saveActiveSession(123, 456)

            expect(localStorage.setItem).not.toHaveBeenCalledWith(
                'active_session',
                expect.anything()
            )
        })
    })

    describe('getActiveSession', () => {
        it('should return null when no session exists', () => {
            sessionStorage.getItem.mockReturnValue(null)

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
            sessionStorage.getItem.mockReturnValue(JSON.stringify(mockSession))

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
            sessionStorage.getItem.mockReturnValue(JSON.stringify(oldSession))

            const result = getActiveSession()

            expect(result).toBeNull()
            expect(sessionStorage.removeItem).toHaveBeenCalledWith('active_session')
        })
    })

    describe('clearActiveSession', () => {
        it('removes the session from this tab and the lock from all of them', () => {
            clearActiveSession()

            expect(sessionStorage.removeItem).toHaveBeenCalledWith('active_session')
            expect(localStorage.removeItem).toHaveBeenCalledWith('session_lock')
        })
    })

    describe('acquireSessionLock', () => {
        it('puts the lock where every tab can see it', () => {
            acquireSessionLock(123)

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'session_lock',
                expect.stringContaining('"sessionId":123')
            )
        })
    })
})
