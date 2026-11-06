import { describe, it, expect } from 'vitest'
import { shouldEndSession } from './sessionEnd'

/**
 * Dena (BCBA, Cor Behavioral), 6 Nov 2026:
 *   "Over the course of the day, therapist have been logged out more often and
 *    needing to sign back in multiple times throughout their sessions."
 *
 * When a request came back 401 the app tried to refresh the token once, and
 * treated every possible failure of that refresh as proof the session was over.
 * A ten second timeout, a dropped connection or the server being slow to wake
 * all ended the session exactly as a rejected token did.
 *
 * Only the server saying the credentials are no good is evidence of that.
 * Anything else means we could not ask, which is not the same answer, and
 * throwing a therapist out mid-session costs them the run they were scoring.
 */
const withStatus = (status) => Object.assign(new Error(`status ${status}`), {
    response: { status },
})

const timedOut = () => Object.assign(new Error('timeout of 10000ms exceeded'), {
    code: 'ECONNABORTED',
})

const offline = () => Object.assign(new Error('Network Error'), { request: {} })

describe('shouldEndSession', () => {
    it('ends the session when the server rejects the credentials', () => {
        expect(shouldEndSession(withStatus(401))).toBe(true)
    })

    it('ends the session when the server refuses them outright', () => {
        expect(shouldEndSession(withStatus(403))).toBe(true)
    })

    it('keeps the session when the refresh timed out', () => {
        // The usual one: the service was cold and took longer than ten seconds
        // to wake. Nothing about the token had changed.
        expect(shouldEndSession(timedOut())).toBe(false)
    })

    it('keeps the session when the device was offline', () => {
        expect(shouldEndSession(offline())).toBe(false)
    })

    it('keeps the session when the server itself failed', () => {
        // A 500 is the server having a bad moment, not a verdict on the token.
        expect(shouldEndSession(withStatus(500))).toBe(false)
        expect(shouldEndSession(withStatus(502))).toBe(false)
        expect(shouldEndSession(withStatus(503))).toBe(false)
    })

    it('keeps the session when the server was too busy to answer', () => {
        expect(shouldEndSession(withStatus(429))).toBe(false)
    })

    it('keeps the session when there is no error to read at all', () => {
        // Nothing is not evidence either. The safe reading is to leave the
        // therapist where they are.
        expect(shouldEndSession(null)).toBe(false)
        expect(shouldEndSession(undefined)).toBe(false)
        expect(shouldEndSession(new Error('something odd'))).toBe(false)
    })
})
