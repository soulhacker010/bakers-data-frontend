/**
 * DOM tests for the program detail panel: it lazily fetches the program detail
 * and renders the key facts (session count, targets with mastery, task steps,
 * recent sessions). The service is mocked so no network is involved.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    getProgramDetail: vi.fn(),
}))

import { getProgramDetail } from '../../services/admin'
import ProgramDetailPanel from './ProgramDetailPanel'

const DETAIL = {
    id: 7,
    name: 'Washing Hands',
    program_type: 'skill',
    data_type: 'task_analysis',
    status: 'maintenance',
    is_active: true,
    description: 'Independent handwashing',
    mastery_criteria: '80% x 3 sessions',
    created_at: '2026-07-01T00:00:00',
    updated_at: '2026-07-10T00:00:00',
    client: { id: 1, name: 'Sam Vimes' },
    therapist: { id: 2, name: 'Dilek Ozhan', email: 'dilek@corbehavioral.com' },
    session_count: 2,
    target_count: 3,
    mastered_count: 1,
    targets: [
        { id: 1, name: 'Turn on water', status: 'mastered', is_mastered: true, current_accuracy: 100 },
        { id: 2, name: 'Apply soap', status: 'active', is_mastered: false, current_accuracy: 40 },
    ],
    task_steps: [
        { id: 1, name: 'Turn on water', position: 0 },
    ],
    recent_sessions: [
        { id: 9, start_time: '2026-07-12T09:00:00', therapist_name: 'Dilek Ozhan', data_points: 1 },
    ],
}

describe('ProgramDetailPanel', () => {
    beforeEach(() => {
        getProgramDetail.mockReset()
    })

    it('fetches by id and renders the program facts', async () => {
        getProgramDetail.mockResolvedValueOnce(DETAIL)
        render(<ProgramDetailPanel programId={7} />)

        await waitFor(() => expect(screen.getByText('Apply soap')).toBeInTheDocument())
        expect(getProgramDetail).toHaveBeenCalledWith(7)
        // real session count surfaced
        expect(screen.getByText('2')).toBeInTheDocument()
        // mastery roll-up + overview content
        expect(screen.getByText('1 mastered')).toBeInTheDocument()
        expect(screen.getByText('Independent handwashing')).toBeInTheDocument()
        expect(screen.getByText('80% x 3 sessions')).toBeInTheDocument()
        // "Turn on water" appears as both a target and a task step
        expect(screen.getAllByText('Turn on water').length).toBeGreaterThanOrEqual(2)
        // recent session content
        expect(screen.getByText('1 point')).toBeInTheDocument()
    })

    it('shows an error state when the fetch fails', async () => {
        getProgramDetail.mockRejectedValueOnce(new Error('boom'))
        render(<ProgramDetailPanel programId={7} />)
        await waitFor(() =>
            expect(screen.getByText(/couldn't load this program/i)).toBeInTheDocument()
        )
    })
})
