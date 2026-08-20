/**
 * Regression test for the "interval feature not showing up on the site" bug.
 *
 * The Measurement method selector must live in the TargetsManager modal — the
 * program-setup page where BCBAs actually add/edit targets. It was originally
 * only added to TargetsList (the progress/results page), so it never appeared
 * where targets are configured. These tests guard against that regression.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../services/targets', () => ({
    getTargets: vi.fn(() => Promise.resolve([])),
    createTarget: vi.fn((programId, data) => Promise.resolve({ id: 99, ...data })),
    updateTarget: vi.fn((id, data) => Promise.resolve({ id, ...data })),
    deleteTarget: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../services/taskSteps', () => ({
    getTaskSteps: vi.fn(() => Promise.resolve([])),
    createTaskStep: vi.fn(),
    updateTaskStep: vi.fn(),
    deleteTaskStep: vi.fn(),
}))
vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))

import TargetsManager from './TargetsManager'
import { createTarget, getTargets } from '../../services/targets'

describe('TargetsManager — measurement method setup', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the Measurement method selector when adding a target', async () => {
        render(<TargetsManager programId={1} dataType="trial" />)
        const addBtn = await screen.findByRole('button', { name: 'Add Target' })
        fireEvent.click(addBtn)

        expect(screen.getByLabelText('Measurement method')).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Whole Interval' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Latency' })).toBeInTheDocument()
    })

    it('saves measurement_type and computed interval_count for an interval target', async () => {
        render(<TargetsManager programId={1} dataType="trial" />)
        const addBtn = await screen.findByRole('button', { name: 'Add Target' })
        fireEvent.click(addBtn)

        fireEvent.change(screen.getByPlaceholderText('Enter target name...'), {
            target: { value: 'On Task' },
        })
        fireEvent.change(screen.getByLabelText('Measurement method'), {
            target: { value: 'whole_interval' },
        })
        // defaults: 30s interval length, 10min observation => 20 intervals
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => expect(createTarget).toHaveBeenCalledTimes(1))
        expect(createTarget).toHaveBeenCalledWith(1, expect.objectContaining({
            name: 'On Task',
            measurement_type: 'whole_interval',
            interval_seconds: 30,
            interval_count: 20,
        }))
    })

    it('defaults to inherit (null measurement_type) when none is chosen', async () => {
        render(<TargetsManager programId={1} dataType="trial" />)
        const addBtn = await screen.findByRole('button', { name: 'Add Target' })
        fireEvent.click(addBtn)

        fireEvent.change(screen.getByPlaceholderText('Enter target name...'), {
            target: { value: 'Plain Target' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Add' }))

        await waitFor(() => expect(createTarget).toHaveBeenCalledTimes(1))
        const [, payload] = createTarget.mock.calls[0]
        expect(payload.measurement_type).toBeNull()
        expect(payload).not.toHaveProperty('interval_count')
    })

    it('shows steps for a task analysis program, as before', async () => {
        render(<TargetsManager programId={1} dataType="task_analysis" />)
        expect(await screen.findByRole('button', { name: 'Add Step' })).toBeInTheDocument()
    })

    it('can be asked for targets on a task analysis program', async () => {
        // Dena, 20 Aug 2026: "adding or adjusting steps on a task analysis (we
        // need to modify targets in addition to adding steps)". The editor
        // showed steps OR targets depending on the program type, so on a task
        // analysis the targets were unreachable from anywhere in the app.
        render(<TargetsManager programId={1} dataType="task_analysis" mode="targets" />)
        expect(await screen.findByRole('button', { name: 'Add Target' })).toBeInTheDocument()
    })

    it('loads targets rather than steps when asked for targets', async () => {
        render(<TargetsManager programId={1} dataType="task_analysis" mode="targets" />)
        await waitFor(() => expect(getTargets).toHaveBeenCalledWith(1))
    })

    it('shows a measurement-method badge on a target with an interval method', async () => {
        getTargets.mockResolvedValueOnce([
            { id: 1, name: 'On Task', status: 'active', measurement_type: 'whole_interval', interval_seconds: 30 },
        ])
        render(<TargetsManager programId={1} dataType="trial" />)
        expect(await screen.findByText('Whole Interval · 30s')).toBeInTheDocument()
    })
})
