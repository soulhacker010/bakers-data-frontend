import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the axios instance so we can assert on the exact request shape.
vi.mock('./api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: [] })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
}))

import api from './api'
import { getPrograms } from './programs'

// Locks the contract with the backend `include_inactive` query param added for
// surfacing archived programs. Default calls must NOT request inactive ones
// (so existing behaviour is unchanged); only an explicit opt-in should.
describe('getPrograms include_inactive contract', () => {
    beforeEach(() => {
        api.get.mockClear()
    })

    it('omits include_inactive by default (all programs)', async () => {
        await getPrograms()
        expect(api.get).toHaveBeenCalledWith('/api/programs', { params: {} })
    })

    it('adds include_inactive=true when requested (all programs)', async () => {
        await getPrograms({ includeInactive: true })
        expect(api.get).toHaveBeenCalledWith('/api/programs', { params: { include_inactive: true } })
    })

    it('omits include_inactive by default (per client)', async () => {
        await getPrograms({ client_id: 5 })
        expect(api.get).toHaveBeenCalledWith('/api/programs/client/5', { params: {} })
    })

    it('adds include_inactive=true when requested (per client)', async () => {
        await getPrograms({ clientId: 7, includeInactive: true })
        expect(api.get).toHaveBeenCalledWith('/api/programs/client/7', { params: { include_inactive: true } })
    })
})
