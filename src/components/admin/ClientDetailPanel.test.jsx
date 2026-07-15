/**
 * DOM tests for the client detail panel: lazily fetches and renders the
 * client's demographics, programs (with badges + session counts), and recent
 * sessions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    getClientDetail: vi.fn(),
}))

import { getClientDetail } from '../../services/admin'
import ClientDetailPanel from './ClientDetailPanel'

const DETAIL = {
    id: 9,
    name: 'Sam Vimes',
    first_name: 'Sam',
    last_name: 'Vimes',
    date_of_birth: '2018-05-15',
    age: 8,
    diagnosis: 'ASD',
    notes: 'Prefers visual schedules',
    is_active: true,
    created_at: '2026-06-01T00:00:00',
    therapist: { id: 3, name: 'Dilek Ozhan', email: 'dilek@corbehavioral.com' },
    program_count: 2,
    session_count: 4,
    programs: [
        { id: 1, name: 'Tolerates Tooth Brush', type: 'skill', data_type: 'trial', status: 'active', session_count: 2 },
        { id: 2, name: 'Head Hitting', type: 'behavior', data_type: 'frequency', status: 'maintenance', session_count: 1 },
    ],
    recent_sessions: [
        { id: 9, start_time: '2026-07-14T09:00:00', therapist_name: 'Dilek Ozhan', duration_minutes: 30 },
    ],
}

describe('ClientDetailPanel', () => {
    beforeEach(() => {
        getClientDetail.mockReset()
    })

    it('fetches by id and renders demographics + programs', async () => {
        getClientDetail.mockResolvedValueOnce(DETAIL)
        render(<ClientDetailPanel clientId={9} />)

        await waitFor(() => expect(screen.getByText('Tolerates Tooth Brush')).toBeInTheDocument())
        expect(getClientDetail).toHaveBeenCalledWith(9)
        expect(screen.getByText('ASD')).toBeInTheDocument()
        expect(screen.getByText('8 yrs')).toBeInTheDocument()
        expect(screen.getByText('Prefers visual schedules')).toBeInTheDocument()
        expect(screen.getByText('Head Hitting')).toBeInTheDocument()
        expect(screen.getByText('30 min')).toBeInTheDocument()
    })

    it('shows an error state when the fetch fails', async () => {
        getClientDetail.mockRejectedValueOnce(new Error('boom'))
        render(<ClientDetailPanel clientId={9} />)
        await waitFor(() =>
            expect(screen.getByText(/couldn't load this client/i)).toBeInTheDocument()
        )
    })
})
