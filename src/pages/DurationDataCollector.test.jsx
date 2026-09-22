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

/**
 * Dena (BCBA, Cor Behavioral), 22 Sept 2026:
 *   "The inability to record a 'zero' on duration timers"
 *
 * Frequency has had a Record Zero button since July. Duration never got one,
 * so a behaviour that was watched for and did not happen could not be entered:
 * the only route was Start then immediately Stop, which records one second of
 * a behaviour that never occurred and is worse than recording nothing.
 *
 * A zero is real clinical data. It is the difference between "this did not
 * happen today" and "nobody looked".
 */
describe('recording a zero', () => {
    it('offers it when the timer is sitting at zero', () => {
        renderCollector({ durationSeconds: 0, isTracking: false })

        expect(screen.getByRole('button', { name: /record zero/i })).toBeInTheDocument()
    })

    it('records a duration of zero seconds', async () => {
        const onRecordZero = vi.fn()
        renderCollector({ durationSeconds: 0, isTracking: false, onRecordZero })

        await userEvent.click(screen.getByRole('button', { name: /record zero/i }))

        expect(onRecordZero).toHaveBeenCalledTimes(1)
    })

    it('does not offer it while the timer is running', () => {
        renderCollector({ durationSeconds: 0, isTracking: true })

        expect(screen.queryByRole('button', { name: /record zero/i })).not.toBeInTheDocument()
    })

    it('does not offer it once time has been put on the clock', () => {
        // There is nothing to say zero about: the behaviour did occur.
        renderCollector({ durationSeconds: 12, isTracking: false })

        expect(screen.queryByRole('button', { name: /record zero/i })).not.toBeInTheDocument()
    })

    it('shows it as done rather than letting it be entered twice', () => {
        renderCollector({ durationSeconds: 0, isTracking: false, zeroRecorded: true })

        expect(screen.getByRole('button', { name: /zero recorded/i })).toBeDisabled()
    })
})
