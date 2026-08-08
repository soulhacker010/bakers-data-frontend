/**
 * DOM tests for the therapist detail panel: lazily fetches and renders the
 * therapist's account flags, counts, clients, and recent sessions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    getUserDetail: vi.fn(),
    setUserRole: vi.fn(),
}))

import { getUserDetail, setUserRole } from '../../services/admin'
import { ToastProvider } from '../../context/ToastContext'
import TherapistDetailPanel from './TherapistDetailPanel'

// The panel raises a toast when a role is changed, so it needs the provider.
const renderPanel = (props) =>
    render(
        <ToastProvider>
            <TherapistDetailPanel {...props} />
        </ToastProvider>
    )

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
        renderPanel({ userId: 3 })

        await waitFor(() => expect(screen.getByText('dilek@corbehavioral.com')).toBeInTheDocument())
        expect(getUserDetail).toHaveBeenCalledWith(3)
        // "Sam Vimes" appears as both a client and a recent-session name
        expect(screen.getAllByText('Sam Vimes').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText('2FA off')).toBeInTheDocument()
        expect(screen.getByText('30 min')).toBeInTheDocument()
    })

    it('shows an error state when the fetch fails', async () => {
        getUserDetail.mockRejectedValueOnce(new Error('boom'))
        renderPanel({ userId: 3 })
        await waitFor(() =>
            expect(screen.getByText(/couldn't load this therapist/i)).toBeInTheDocument()
        )
    })

    it('assigns a clinical role', async () => {
        // Roles used to be settable by the account holder on their own
        // profile. Assignment belongs to an administrator.
        getUserDetail.mockResolvedValueOnce(DETAIL)
        setUserRole.mockResolvedValueOnce({ role: 'coordinator' })
        renderPanel({ userId: 3 })

        await waitFor(() => expect(screen.getByText('dilek@corbehavioral.com')).toBeInTheDocument())

        const select = screen.getByRole('combobox')
        expect(select.value).toBe('bcba')

        fireEvent.change(select, { target: { value: 'coordinator' } })
        await waitFor(() => expect(setUserRole).toHaveBeenCalledWith(3, 'coordinator'))
    })

    it('offers coordinator as an assignable role', async () => {
        getUserDetail.mockResolvedValueOnce(DETAIL)
        renderPanel({ userId: 3 })

        await waitFor(() => expect(screen.getByText('dilek@corbehavioral.com')).toBeInTheDocument())
        expect(screen.getByRole('option', { name: /coordinator/i })).toBeInTheDocument()
    })
})
