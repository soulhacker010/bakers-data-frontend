import { describe, it, expect } from 'vitest'
import {
    restoredEntries,
    restoredNotes,
    zeroRecordedProgramIds,
    findResumableSession,
} from './sessionResume'

/**
 * Coming back to a session in progress — after a wellness check-in, a refresh,
 * or the tablet locking — must show the data already collected. The entries are
 * on the server the moment they are tapped; the page simply never asked for
 * them, so every return looked like a session that had restarted.
 */

describe('restoredEntries', () => {
    it('returns the entries already recorded against the session', () => {
        const session = {
            id: 9,
            data: [
                { id: 1, program_id: 4, data_type: 'trial', result: 'correct' },
                { id: 2, program_id: 4, data_type: 'trial', result: 'incorrect' },
            ],
        }

        expect(restoredEntries(session)).toHaveLength(2)
        expect(restoredEntries(session)[0].result).toBe('correct')
    })

    it('preserves program_id so per-program tallies rebuild correctly', () => {
        const session = {
            data: [
                { id: 1, program_id: 4, result: 'correct' },
                { id: 2, program_id: 7, result: 'correct' },
            ],
        }

        const forProgramFour = restoredEntries(session).filter((d) => d.program_id === 4)
        expect(forProgramFour).toHaveLength(1)
    })

    it('keeps frequency counts including subtractions so the running total is right', () => {
        const session = {
            data: [
                { id: 1, program_id: 4, data_type: 'frequency', count: 3 },
                { id: 2, program_id: 4, data_type: 'frequency', count: -1 },
            ],
        }

        const total = restoredEntries(session).reduce((sum, d) => sum + (d.count || 0), 0)
        expect(total).toBe(2)
    })

    it('returns nothing for a session that has no data yet', () => {
        expect(restoredEntries({ id: 1, data: [] })).toEqual([])
    })

    it('returns nothing when the server omits the data field', () => {
        expect(restoredEntries({ id: 1 })).toEqual([])
    })

    it('returns nothing when there is no session at all', () => {
        expect(restoredEntries(null)).toEqual([])
        expect(restoredEntries(undefined)).toEqual([])
    })
})

describe('restoredNotes', () => {
    it('restores notes typed before leaving the page', () => {
        expect(restoredNotes({ notes: 'Refused the first three trials.' }))
            .toBe('Refused the first three trials.')
    })

    it('gives an empty string when the session carries no notes', () => {
        // Not null: this value is bound to a textarea, and it is written back
        // to the server on end. An empty string is the only safe blank.
        expect(restoredNotes({ notes: null })).toBe('')
        expect(restoredNotes({})).toBe('')
        expect(restoredNotes(null)).toBe('')
    })
})

describe('zeroRecordedProgramIds', () => {
    it('marks a program whose explicit zero was already saved', () => {
        const entries = [
            { program_id: 4, data_type: 'frequency', count: 0 },
        ]

        expect(zeroRecordedProgramIds(entries).has(4)).toBe(true)
    })

    it('does not mark a program that simply has counts recorded', () => {
        const entries = [
            { program_id: 4, data_type: 'frequency', count: 5 },
        ]

        expect(zeroRecordedProgramIds(entries).has(4)).toBe(false)
    })

    it('does not mark a program from an unrelated trial entry', () => {
        const entries = [
            { program_id: 4, data_type: 'trial', result: 'incorrect' },
        ]

        expect(zeroRecordedProgramIds(entries).has(4)).toBe(false)
    })

    it('handles an empty or missing list', () => {
        expect(zeroRecordedProgramIds([]).size).toBe(0)
        expect(zeroRecordedProgramIds(undefined).size).toBe(0)
    })
})

/**
 * Starting collection reached for a new session every time, so a refresh
 * before the session id was in the address bar opened a second one against the
 * same learner. The first was left running with data in it. Sessions that are
 * never ended are how a day's billing stops adding up.
 *
 * Times below are naive UTC, the way the server sends them. The clinic runs on
 * Eastern, so which day a session belongs to is decided in Eastern.
 */
describe('findResumableSession', () => {
    const USER = 12
    const NOW = new Date('2026-08-20T18:00:00Z')   // 14:00 Thursday, Eastern

    it('resumes this therapist\'s session that is still open today', () => {
        const sessions = [
            { id: 501, user_id: USER, start_time: '2026-08-20T14:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })?.id).toBe(501)
    })

    it('ignores a session that has already been ended', () => {
        const sessions = [
            { id: 501, user_id: USER, start_time: '2026-08-20T14:00:00', end_time: '2026-08-20T15:00:00' },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })).toBeNull()
    })

    it('never resumes a session left open on an earlier day', () => {
        // Merging today's data into yesterday's record would corrupt both.
        const sessions = [
            { id: 400, user_id: USER, start_time: '2026-08-19T14:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })).toBeNull()
    })

    it('treats an evening session as belonging to the clinic day it was run', () => {
        // 01:00 UTC on the 20th is 21:00 Eastern on the 19th — yesterday's work.
        const sessions = [
            { id: 401, user_id: USER, start_time: '2026-08-20T01:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })).toBeNull()
    })

    it('does not take over a session another therapist has open', () => {
        const sessions = [
            { id: 502, user_id: 99, start_time: '2026-08-20T14:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })).toBeNull()
    })

    it('resumes the most recently started when more than one is open', () => {
        const sessions = [
            { id: 503, user_id: USER, start_time: '2026-08-20T13:00:00', end_time: null },
            { id: 504, user_id: USER, start_time: '2026-08-20T16:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: USER, now: NOW })?.id).toBe(504)
    })

    it('returns nothing when there is no session to resume', () => {
        expect(findResumableSession([], { userId: USER, now: NOW })).toBeNull()
        expect(findResumableSession(undefined, { userId: USER, now: NOW })).toBeNull()
    })

    it('returns nothing when the current user is unknown', () => {
        // Without knowing who is asking, resuming could hand one therapist
        // another's open session.
        const sessions = [
            { id: 501, user_id: USER, start_time: '2026-08-20T14:00:00', end_time: null },
        ]

        expect(findResumableSession(sessions, { userId: null, now: NOW })).toBeNull()
    })
})
