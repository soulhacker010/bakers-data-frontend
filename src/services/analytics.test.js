import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the axios instance so we can assert on the exact request shape.
vi.mock('./api', () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: {} })),
    },
}))

import api from './api'
import { exportProgramData } from './analytics'

/**
 * Contract for the Progress page's graph export. Regression: this used to be
 * window.open('/api/analytics/export?...') — a relative URL that hit the
 * Vercel SPA rewrite (served the app's 404 page) and carried no auth token.
 * It must go through the authenticated api client as a blob download.
 */
describe('exportProgramData', () => {
    beforeEach(() => {
        api.get.mockClear()
        window.URL.createObjectURL = vi.fn(() => 'blob:mock')
        window.URL.revokeObjectURL = vi.fn()
    })

    it('downloads the CSV through the authenticated api client with the program filter', async () => {
        api.get.mockResolvedValueOnce({ data: 'Date,Client,Program\n' })
        await exportProgramData(42, 'Manding Program')

        expect(api.get).toHaveBeenCalledWith('/api/analytics/export?program_id=42', {
            responseType: 'blob',
        })
        expect(window.URL.createObjectURL).toHaveBeenCalled()
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
    })

    it('propagates failures so the page can show an error toast', async () => {
        api.get.mockRejectedValueOnce(new Error('Network error'))
        await expect(exportProgramData(42)).rejects.toThrow('Network error')
    })
})
