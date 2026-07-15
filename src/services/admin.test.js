import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the axios instance so we can assert on the exact request shape.
vi.mock('./api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
}))

import api from './api'
import { getProgramDetail, getUserDetail, getClientDetail } from './admin'

// Locks the contracts for the admin detail endpoints that power the drawers.
describe('admin detail endpoint contracts', () => {
    beforeEach(() => {
        api.get.mockClear()
    })

    it('getProgramDetail requests the program detail endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: { id: 42, name: 'Washing Hands' } })
        const result = await getProgramDetail(42)
        expect(api.get).toHaveBeenCalledWith('/api/admin/programs/42')
        expect(result).toEqual({ id: 42, name: 'Washing Hands' })
    })

    it('getUserDetail requests the user detail endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: { id: 3, email: 'a@b.c' } })
        const result = await getUserDetail(3)
        expect(api.get).toHaveBeenCalledWith('/api/admin/users/3/detail')
        expect(result).toEqual({ id: 3, email: 'a@b.c' })
    })

    it('getClientDetail requests the client detail endpoint', async () => {
        api.get.mockResolvedValueOnce({ data: { id: 9, name: 'Sam' } })
        const result = await getClientDetail(9)
        expect(api.get).toHaveBeenCalledWith('/api/admin/clients/9/detail')
        expect(result).toEqual({ id: 9, name: 'Sam' })
    })
})
