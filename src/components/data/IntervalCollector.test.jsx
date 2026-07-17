/**
 * Interval collector timing tests.
 *
 * The critical scenarios simulate what actually happens on a therapist's iPad:
 * the screen locks or Safari throttles the tab, JS timers stop firing, and
 * only wall-clock time advances. A tick-counting timer freezes forever; a
 * wall-clock timer must catch up the moment the page is visible again.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import IntervalCollector from './IntervalCollector'

const TARGET = {
    id: 1,
    name: 'Hand flapping',
    measurement_type: 'partial_interval',
    interval_seconds: 30,
    interval_count: 3,
}

describe('IntervalCollector', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-07-17T10:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const start = () => {
        act(() => {
            screen.getByText(/Start Intervals/i).click()
        })
    }

    it('counts down and prompts for a score when the interval elapses normally', () => {
        render(<IntervalCollector target={TARGET} onRecord={vi.fn()} />)
        start()
        expect(screen.getByText('00:30')).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(31_000)
        })
        expect(screen.getByText(/Did the behavior occur at ANY point/i)).toBeInTheDocument()
        expect(screen.getByText(/YES/)).toBeInTheDocument()
    })

    it('catches up after timers were suspended (screen lock): time jumps, then visibilitychange', () => {
        render(<IntervalCollector target={TARGET} onRecord={vi.fn()} />)
        start()

        // Simulate iPad lock: wall clock advances 45s but NO timer ticks fire.
        act(() => {
            vi.setSystemTime(new Date('2026-07-17T10:00:45Z'))
            document.dispatchEvent(new Event('visibilitychange'))
        })

        // A tick-counting timer would still show 00:30 and never prompt.
        expect(screen.getByText(/Did the behavior occur at ANY point/i)).toBeInTheDocument()
    })

    it('records the score with the interval index and auto-advances to the next interval', () => {
        const onRecord = vi.fn()
        render(<IntervalCollector target={TARGET} onRecord={onRecord} />)
        start()
        act(() => {
            vi.advanceTimersByTime(31_000)
        })
        act(() => {
            screen.getByText(/YES/).click()
        })
        expect(onRecord).toHaveBeenCalledWith({ result: 'present', interval_index: 1 })
        // Auto-advanced: interval 2 of 3 counting down again.
        expect(screen.getByText(/Interval 2 of 3/i)).toBeInTheDocument()
        expect(screen.getByText('00:30')).toBeInTheDocument()
    })

    it('completes the block after all intervals are scored', () => {
        const onRecord = vi.fn()
        render(<IntervalCollector target={TARGET} onRecord={onRecord} />)
        start()
        for (let i = 0; i < 3; i++) {
            act(() => {
                vi.advanceTimersByTime(31_000)
            })
            act(() => {
                screen.getByText(i === 0 ? /YES/ : /NO/).click()
            })
        }
        expect(onRecord).toHaveBeenCalledTimes(3)
        expect(screen.getByText(/Block complete/i)).toBeInTheDocument()
        expect(screen.getByText(/33% present/i)).toBeInTheDocument()
    })

    it('banks the remaining time while the session is paused instead of letting it run out', () => {
        const { rerender } = render(<IntervalCollector target={TARGET} onRecord={vi.fn()} />)
        start()
        act(() => {
            vi.advanceTimersByTime(10_000) // 20s left
        })
        rerender(<IntervalCollector target={TARGET} onRecord={vi.fn()} disabled />)

        // A long pause passes on the wall clock.
        act(() => {
            vi.setSystemTime(new Date('2026-07-17T10:05:00Z'))
        })
        rerender(<IntervalCollector target={TARGET} onRecord={vi.fn()} disabled={false} />)

        // Still ~20s left — the pause must not have consumed the interval.
        act(() => {
            vi.advanceTimersByTime(1_000)
        })
        expect(screen.queryByText(/Did the behavior occur/i)).not.toBeInTheDocument()
        expect(screen.getByText('00:19')).toBeInTheDocument()
    })
})
