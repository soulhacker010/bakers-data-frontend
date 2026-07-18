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
