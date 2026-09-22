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
import { createTarget, getTargets, updateTarget } from '../../services/targets'

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

/**
 * Dena (BCBA, Cor Behavioral), 22 Sept 2026:
 *   "Being able to modify mastery criteria within the target (not just within
 *    the program)"
 *
 * The same trap as June 2026. Mastery threshold and the number of consecutive
 * sessions were on AddProgramPage, which is where a program is first created,
 * and nowhere on TargetsManager, which is the program EDIT page where a BCBA
 * actually revisits a target. So the criteria could be set once and never
 * changed.
 *
 * This matters more since 22 Sept, because the mastery calculation now reads
 * the threshold off the target rather than parsing it out of a sentence. A
 * number the clinician cannot reach is a number they cannot correct.
 */
describe('mastery criteria on the program edit page', () => {
    const openEditFor = async (target) => {
        getTargets.mockResolvedValue([target])
        render(<TargetsManager programId={1} dataType="trial" mode="targets" />)
        await screen.findByText(target.name)
        await fireEvent.click(screen.getByLabelText(`Edit ${target.name}`))
    }

    const target = {
        id: 5,
        name: 'Eye contact',
        description: '',
        status: 'active',
        mastery_threshold: 80,
        mastery_consecutive_sessions: 3,
    }

    it('shows the threshold the target is actually set to', async () => {
        await openEditFor(target)

        expect(await screen.findByLabelText(/mastery threshold/i)).toHaveValue(80)
    })

    it('shows the number of consecutive sessions required', async () => {
        await openEditFor(target)

        expect(await screen.findByLabelText(/consecutive sessions/i)).toHaveValue(3)
    })

    it('saves a changed threshold against the target', async () => {
        await openEditFor(target)

        const field = await screen.findByLabelText(/mastery threshold/i)
        await fireEvent.change(field, { target: { value: '95' } })
        await fireEvent.click(screen.getByRole('button', { name: /update/i }))

        await waitFor(() => expect(updateTarget).toHaveBeenCalled())
        const [, payload] = updateTarget.mock.calls.at(-1)
        expect(payload.mastery_threshold).toBe(95)
    })

    it('saves a changed session count against the target', async () => {
        await openEditFor(target)

        const field = await screen.findByLabelText(/consecutive sessions/i)
        await fireEvent.change(field, { target: { value: '5' } })
        await fireEvent.click(screen.getByRole('button', { name: /update/i }))

        await waitFor(() => expect(updateTarget).toHaveBeenCalled())
        const [, payload] = updateTarget.mock.calls.at(-1)
        expect(payload.mastery_consecutive_sessions).toBe(5)
    })
})
