import { describe, it, expect } from 'vitest'
import { parseServerTime, sessionElapsedSeconds, formatClock } from './sessionClock'

// A fixed "now" so every case is deterministic.
const NOW = Date.UTC(2026, 7, 7, 15, 0, 0) // 2026-08-07T15:00:00Z

describe('parseServerTime', () => {
    it('reads a naive server timestamp as UTC, not local time', () => {
        // The backend stores datetime.utcnow() and serializes it WITHOUT a
        // timezone suffix. Reading it as local time is what would put the
        // session clock hours out for a US-based clinic.
        expect(parseServerTime('2026-08-07T14:30:00')).toBe(Date.UTC(2026, 7, 7, 14, 30, 0))
    })

    it('honours an explicit Z suffix', () => {
        expect(parseServerTime('2026-08-07T14:30:00Z')).toBe(Date.UTC(2026, 7, 7, 14, 30, 0))
    })

    it('honours an explicit offset', () => {
        expect(parseServerTime('2026-08-07T10:30:00-04:00')).toBe(Date.UTC(2026, 7, 7, 14, 30, 0))
    })

    it('keeps fractional seconds', () => {
        expect(parseServerTime('2026-08-07T14:30:00.500')).toBe(Date.UTC(2026, 7, 7, 14, 30, 0) + 500)
    })

    it('returns null for missing or unparseable input', () => {
        expect(parseServerTime(null)).toBeNull()
        expect(parseServerTime(undefined)).toBeNull()
        expect(parseServerTime('')).toBeNull()
        expect(parseServerTime('not a date')).toBeNull()
    })
})

describe('sessionElapsedSeconds', () => {
    it('returns 0 when there is no session yet', () => {
        expect(sessionElapsedSeconds(null, NOW)).toBe(0)
        expect(sessionElapsedSeconds({}, NOW)).toBe(0)
    })

    it('counts from the session start time', () => {
        const session = { start_time: '2026-08-07T14:30:00' }
        expect(sessionElapsedSeconds(session, NOW)).toBe(30 * 60)
    })

    it('is unaffected by how long this page has been open', () => {
        // The whole point of the fix: the value depends only on the server
        // record, so navigating away and back returns the same reading.
        const session = { start_time: '2026-08-07T14:30:00' }
        const first = sessionElapsedSeconds(session, NOW)
        const afterRemount = sessionElapsedSeconds({ ...session }, NOW)
        expect(afterRemount).toBe(first)
    })

    it('subtracts time already banked from previous pauses', () => {
        const session = { start_time: '2026-08-07T14:30:00', total_paused_seconds: 300 }
        expect(sessionElapsedSeconds(session, NOW)).toBe(30 * 60 - 300)
    })

    it('holds steady while the session is paused', () => {
        const session = {
            start_time: '2026-08-07T14:30:00',
            is_paused: true,
            pause_started_at: '2026-08-07T14:50:00',
        }
        // Paused at the 20 minute mark, so it should still read 20 minutes.
        expect(sessionElapsedSeconds(session, NOW)).toBe(20 * 60)
        // ...and still read 20 minutes a further ten minutes later.
        expect(sessionElapsedSeconds(session, NOW + 10 * 60 * 1000)).toBe(20 * 60)
    })

    it('combines banked pauses with the pause in progress', () => {
        const session = {
            start_time: '2026-08-07T14:30:00',
            total_paused_seconds: 120,
            is_paused: true,
            pause_started_at: '2026-08-07T14:50:00',
        }
        expect(sessionElapsedSeconds(session, NOW)).toBe(20 * 60 - 120)
    })

    it('resumes counting once the pause is banked', () => {
        const session = {
            start_time: '2026-08-07T14:30:00',
            total_paused_seconds: 600,
            is_paused: false,
            pause_started_at: null,
        }
        expect(sessionElapsedSeconds(session, NOW)).toBe(30 * 60 - 600)
    })

    it('stops at the end time for a finished session', () => {
        const session = {
            start_time: '2026-08-07T14:30:00',
            end_time: '2026-08-07T14:45:00',
        }
        expect(sessionElapsedSeconds(session, NOW)).toBe(15 * 60)
    })

    it('never returns a negative value when the clock is skewed', () => {
        const session = { start_time: '2026-08-07T15:30:00' } // starts in the future
        expect(sessionElapsedSeconds(session, NOW)).toBe(0)
    })

    it('never returns a negative value when pauses exceed elapsed time', () => {
        const session = { start_time: '2026-08-07T14:30:00', total_paused_seconds: 99999 }
        expect(sessionElapsedSeconds(session, NOW)).toBe(0)
    })

    it('ignores a paused flag with no recorded pause start', () => {
        const session = { start_time: '2026-08-07T14:30:00', is_paused: true, pause_started_at: null }
        expect(sessionElapsedSeconds(session, NOW)).toBe(30 * 60)
    })
})

describe('formatClock', () => {
    it('formats as HH:MM:SS', () => {
        expect(formatClock(0)).toBe('00:00:00')
        expect(formatClock(59)).toBe('00:00:59')
        expect(formatClock(60)).toBe('00:01:00')
        expect(formatClock(3661)).toBe('01:01:01')
    })

    it('keeps counting past 24 hours rather than wrapping', () => {
        expect(formatClock(25 * 3600)).toBe('25:00:00')
    })

    it('treats negative or missing input as zero', () => {
        expect(formatClock(-5)).toBe('00:00:00')
        expect(formatClock(null)).toBe('00:00:00')
    })
})
