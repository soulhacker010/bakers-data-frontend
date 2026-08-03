import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the axios instance so we can assert on the exact request shape.
vi.mock('./api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
    },
}))

import api from './api'
import {
    getStatementsForMood,
    recordCheckin,
    getClientWellness,
    getSessionWellness,
    getAttention,
} from './wellness'

// Locks the contracts for the wellness module endpoints.
describe('wellness service contracts', () => {
    beforeEach(() => {
        api.get.mockClear()
        api.post.mockClear()
    })

    it('getStatementsForMood requests the band for the mood score', async () => {
        api.get.mockResolvedValueOnce({ data: [{ id: 1, text: 'I feel safe.' }] })
        const result = await getStatementsForMood(1)
        expect(api.get).toHaveBeenCalledWith('/api/wellness/statements?mood_score=1')
        expect(result).toEqual([{ id: 1, text: 'I feel safe.' }])
    })

    it('recordCheckin posts the completed check-in', async () => {
        api.post.mockResolvedValueOnce({ data: { id: 9, clinical_flag: true } })
        const payload = {
            client_id: 7, session_id: 3, mood_score: 2,
            statement_id: 1, statement_response: 'not_right_now',
            support_requested: 'quiet_space',
        }
        const result = await recordCheckin(payload)
        expect(api.post).toHaveBeenCalledWith('/api/wellness/checkins', payload)
        expect(result).toEqual({ id: 9, clinical_flag: true })
    })

    it('getClientWellness requests the client history', async () => {
        api.get.mockResolvedValueOnce({ data: { checkins: [] } })
        await getClientWellness(7)
        expect(api.get).toHaveBeenCalledWith('/api/wellness/clients/7')
    })

    it('getSessionWellness requests the session check-ins', async () => {
        api.get.mockResolvedValueOnce({ data: [] })
        await getSessionWellness(3)
        expect(api.get).toHaveBeenCalledWith('/api/wellness/sessions/3')
    })

    it('getAttention requests the flagged recent check-ins', async () => {
        api.get.mockResolvedValueOnce({ data: [] })
        await getAttention()
        expect(api.get).toHaveBeenCalledWith('/api/wellness/attention')
    })
})
