import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
}))

import api from './api'
import { getSessions } from './sessions'

/**
 * Dena (BCBA, Cor Behavioral), 28 Oct 2026:
 *   "Staff aren't allowed to go back to sessions past a certain time frame
 *    (example: data wasn't correct on the graph for 10/7 and when she tried to
 *    add it, it wouldn't let her and she can't access the actual session under
 *    sessions. It only goes back to the 19th of that month)"
 *
 * Two separate causes. The list is capped at a number of sessions rather than a
 * date, which reads as an arbitrary cutoff once a practice is busy. And the
 * client page asked for one client's sessions with the wrong spelling of the
 * option, so the filter was dropped and it listed the most recent sessions
 * across every client that user can reach. getPrograms already accepts both
 * spellings, with a comment saying so, which is how long this trap has been
 * sitting here.
 */
describe('getSessions client filter', () => {
    beforeEach(() => {
        api.get.mockClear()
    })

    const requestedUrl = () => api.get.mock.calls.at(-1)[0]

    it('filters by client when given clientId', async () => {
        await getSessions({ clientId: 7 })

        expect(requestedUrl()).toContain('client_id=7')
    })

    it('filters by client when given client_id, which the pages actually pass', async () => {
        await getSessions({ client_id: 7 })

        expect(requestedUrl()).toContain('client_id=7')
    })

    it('asks for every client when no client is named', async () => {
        await getSessions()

        expect(requestedUrl()).not.toContain('client_id')
    })

    it('passes a limit through when one is given', async () => {
        await getSessions({ clientId: 7, limit: 100 })

        expect(requestedUrl()).toContain('limit=100')
    })

    it('is not fooled by a client id of zero being falsy', async () => {
        // No real client has id 0, but dropping a filter because the value is
        // falsy is the whole bug above, so it is pinned here rather than left
        // to be rediscovered.
        await getSessions({ clientId: 0 })

        expect(requestedUrl()).toContain('client_id=0')
    })
})
