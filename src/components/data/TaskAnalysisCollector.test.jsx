/**
 * Task-analysis step selections must survive the collector unmounting —
 * switching program in the session sidebar mid-task is routine, and losing
 * a half-scored 12-step task means re-observing it from memory.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'

vi.mock('../../services/taskSteps', () => ({
    getTaskSteps: vi.fn(),
}))

import { getTaskSteps } from '../../services/taskSteps'
import TaskAnalysisCollector from './TaskAnalysisCollector'

const STEPS = [
    { id: 1, name: 'Turn on water' },
    { id: 2, name: 'Apply soap' },
]

describe('TaskAnalysisCollector', () => {
    beforeEach(() => {
        // The shared test setup replaces sessionStorage with no-op stubs;
        // persistence is under test, so install a faithful in-memory Storage.
        const store = new Map()
        global.sessionStorage = {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)) },
            removeItem: (k) => { store.delete(k) },
            clear: () => { store.clear() },
        }
        getTaskSteps.mockReset()
        getTaskSteps.mockResolvedValue(STEPS)
    })

    it('keeps selected prompt levels across a program switch (unmount/remount)', async () => {
        const { unmount } = render(<TaskAnalysisCollector programId={5} onRecord={vi.fn()} />)
        await waitFor(() => expect(screen.getByText('Turn on water')).toBeInTheDocument())

        // Score step 1 as Independent.
        act(() => {
            screen.getAllByTitle('Independent')[0].click()
        })
        expect(screen.getByText('1/2 steps')).toBeInTheDocument()

        unmount() // switched to another program mid-task

        render(<TaskAnalysisCollector programId={5} onRecord={vi.fn()} />)
        await waitFor(() => expect(screen.getByText('Turn on water')).toBeInTheDocument())

        // Selection survived.
        expect(screen.getByText('1/2 steps')).toBeInTheDocument()
    })

    it('clears the saved run after a successful submit', async () => {
        const onRecord = vi.fn().mockResolvedValue(undefined)
        const { unmount } = render(<TaskAnalysisCollector programId={5} onRecord={onRecord} />)
        await waitFor(() => expect(screen.getByText('Turn on water')).toBeInTheDocument())

        act(() => {
            screen.getAllByTitle('Independent')[0].click()
        })
        await act(async () => {
            screen.getByText(/Record 1 Step/i).click()
        })
        expect(onRecord).toHaveBeenCalledTimes(1)

        unmount()
        render(<TaskAnalysisCollector programId={5} onRecord={onRecord} />)
        await waitFor(() => expect(screen.getByText('Turn on water')).toBeInTheDocument())
        expect(screen.getByText('0/2 steps')).toBeInTheDocument()
    })
})

/**
 * Dena (BCBA, Cor Behavioral), 6 Nov 2026:
 *   "we can't read the full task analysis targets when running the task
 *    analysis programs"
 *
 * The step name was rendered with Tailwind's `truncate`, which forces one line
 * and cuts the rest off behind an ellipsis. A task analysis step is an
 * instruction rather than a label, often a whole sentence, and the therapist
 * is reading it to decide what prompt level the learner needed. A step they
 * cannot read is a step they cannot score honestly.
 */
describe('reading the step while running the program', () => {
    const longStep = {
        id: 1,
        name: 'Turn on the water and adjust the temperature until it is comfortable',
        description: 'Wait for the water to run warm before putting hands under it',
    }

    beforeEach(() => {
        getTaskSteps.mockResolvedValue([longStep])
    })

    it('shows the whole step name, not a cut-off line', async () => {
        render(<TaskAnalysisCollector programId={7} onRecord={vi.fn()} />)

        const name = await screen.findByText(longStep.name)
        expect(name.className).not.toMatch(/\btruncate\b/)
    })

    it('shows the whole description too', async () => {
        render(<TaskAnalysisCollector programId={7} onRecord={vi.fn()} />)

        const description = await screen.findByText(longStep.description)
        expect(description.className).not.toMatch(/\btruncate\b/)
    })
})
