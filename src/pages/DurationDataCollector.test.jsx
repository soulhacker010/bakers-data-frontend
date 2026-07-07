/**
 * DOM tests for the Duration data collector's controls — specifically the new
 * manual +/- adjustment buttons and that the display reflects the seconds it
 * is given. The timing math itself is covered in utils/durationTimer.test.js;
 * here we prove the UI is wired to the right handlers.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DurationDataCollector } from './SessionCollectPage'

const noop = () => {}

function renderCollector(overrides = {}) {
    const props = {
        onRecord: noop,
        onStart: noop,
        onStop: noop,
        onReset: noop,
        onAdjust: noop,
        durationSeconds: 0,
        isTracking: false,
        disabled: false,
        ...overrides,
    }
    render(<DurationDataCollector {...props} />)
    return props
}

describe('DurationDataCollector display', () => {
    it('formats the given seconds as mm:ss', () => {
        renderCollector({ durationSeconds: 95 }) // 1:35
        expect(screen.getByText('01:35')).toBeInTheDocument()
    })
})

describe('manual +/- adjustment buttons', () => {
    it('wires -5s, -1s, +1s, +5s to -5, -1, 1, 5 in order', async () => {
        const user = userEvent.setup()
        const onAdjust = vi.fn()
        renderCollector({ onAdjust })

        const adjustButtons = screen
            .getAllByRole('button')
            .filter((b) => /\d+s$/.test(b.textContent.trim()))

        expect(adjustButtons).toHaveLength(4)
        for (const b of adjustButtons) {
            await user.click(b)
        }
        expect(onAdjust.mock.calls.map((c) => c[0])).toEqual([-5, -1, 1, 5])
    })

    it('disables the adjust buttons when the session is paused (disabled)', () => {
        renderCollector({ disabled: true })
        const adjustButtons = screen
            .getAllByRole('button')
            .filter((b) => /\d+s$/.test(b.textContent.trim()))
        for (const b of adjustButtons) {
            expect(b).toBeDisabled()
        }
    })
})

describe('start / stop / reset wiring', () => {
    it('records the shown duration on stop', async () => {
        const user = userEvent.setup()
        const onStop = vi.fn()
        const onRecord = vi.fn()
        renderCollector({ onStop, onRecord, isTracking: true, durationSeconds: 42 })

        await user.click(screen.getByRole('button', { name: /stop/i }))
        expect(onStop).toHaveBeenCalled()
        expect(onRecord).toHaveBeenCalledWith({ duration_seconds: 42 })
    })
})
