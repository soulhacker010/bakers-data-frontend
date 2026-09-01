/**
 * Dr Joe, 1 Sept 2026, after an RBT opened Staff Access:
 *   "i know the error is cos staff can perform this action instead of Failed to
 *    load staff members why not just give a meaningful message instead of making
 *    it look like an error"
 *
 * A rule working correctly was being presented as a software fault: a red box
 * reading "Failed to load staff members", followed by an empty list and an
 * "Assign 0 Staff" button that could only fail. Staff report that as a bug.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/staff', () => ({
    getStaffMembers: vi.fn(),
    getClientAssignments: vi.fn(),
    bulkAssignStaff: vi.fn(),
}))

import StaffAssignmentModal from './StaffAssignmentModal'
import { getStaffMembers, getClientAssignments } from '../../services/staff'

const refused = () => Object.assign(new Error('Request failed with status code 403'), {
    response: { status: 403, data: { detail: 'Staff members cannot perform this action' } },
})

const broken = () => Object.assign(new Error('Request failed with status code 500'), {
    response: { status: 500, data: {} },
})

const open = () => render(
    <StaffAssignmentModal clientId={3} clientName="mac book" onClose={vi.fn()} onSaved={vi.fn()} />
)

beforeEach(() => {
    vi.clearAllMocks()
})

describe('when the signed-in user is not allowed to assign staff', () => {
    beforeEach(() => {
        getStaffMembers.mockRejectedValue(refused())
        getClientAssignments.mockRejectedValue(refused())
    })

    it('explains the rule instead of reporting a failure', async () => {
        open()

        expect(await screen.findByText(/only BCBAs and administrators/i)).toBeInTheDocument()
        expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument()
    })

    it('does not offer a save that could only be refused', async () => {
        open()

        await screen.findByText(/only BCBAs and administrators/i)
        expect(screen.queryByRole('button', { name: /assign/i })).not.toBeInTheDocument()
    })

    it('does not show the empty list, which reads as nobody being available', async () => {
        open()

        await screen.findByText(/only BCBAs and administrators/i)
        expect(screen.queryByText(/no users available to assign/i)).not.toBeInTheDocument()
    })
})

describe('when the request genuinely fails', () => {
    it('still reports it as a failure', async () => {
        getStaffMembers.mockRejectedValue(broken())
        getClientAssignments.mockRejectedValue(broken())

        open()

        expect(await screen.findByText(/failed to load staff members/i)).toBeInTheDocument()
    })
})

describe('when the user is allowed', () => {
    it('lists the staff it was given', async () => {
        getStaffMembers.mockResolvedValue([
            { id: 7, full_name: 'Dena Okafor', email: 'dena@example.com', role: 'bcba' },
        ])
        getClientAssignments.mockResolvedValue([])

        open()

        expect(await screen.findByText('Dena Okafor')).toBeInTheDocument()
        expect(screen.queryByText(/only BCBAs and administrators/i)).not.toBeInTheDocument()
    })
})
