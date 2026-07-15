/**
 * DOM tests for the therapist detail panel: lazily fetches and renders the
 * therapist's account flags, counts, clients, and recent sessions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    getUserDetail: vi.fn(),
}))

import { getUserDetail } from '../../services/admin'
import TherapistDetailPanel from './TherapistDetailPanel'

const DETAIL = {
    id: 3,
    email: 'dilek@corbehavioral.com',
    full_name: 'Dilek Ozhan',
    role: 'bcba',
    is_active: true,
    is_approved: true,
    is_verified: true,
    is_admin: false,
    is_superadmin: false,
    otp_enabled: false,
    created_at: '2026-06-01T00:00:00',
    client_count: 1,
    program_count: 2,
    session_count: 4,
    last_session: '2026-07-14T09:00:00',
    clients: [
        { id: 1, name: 'Sam Vimes', program_count: 2, session_count: 4, last_session: '2026-07-14T09:00:00' },
    ],
    recent_sessions: [
        { id: 9, start_time: '2026-07-14T09:00:00', client_name: 'Sam Vimes', duration_minutes: 30 },
    ],
}

describe('TherapistDetailPanel', () => {
    beforeEach(() => {
        getUserDetail.mockReset()
    })

    it('fetches by id and renders account + related data', async () => {
        getUserDetail.mockResolvedValueOnce(DETAIL)
        render(<TherapistDetailPanel userId={3} />)

        await waitFor(() => expect(screen.getByText('dilek@corbehavioral.com')).toBeInTheDocument())
        expect(getUserDetail).toHaveBeenCalledWith(3)
        // "Sam Vimes" appears as both a client and a recent-session name
        expect(screen.getAllByText('Sam Vimes').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('2FA off')).toBeInTheDocument()
        expect(screen.getByText('30 min')).toBeInTheDocument()
    })

    it('shows an error state when the fetch fails', async () => {
        getUserDetail.mockRejectedValueOnce(new Error('boom'))
        render(<TherapistDetailPanel userId={3} />)
        await waitFor(() =>
            expect(screen.getByText(/couldn't load this therapist/i)).toBeInTheDocument()
        )
    })
})
