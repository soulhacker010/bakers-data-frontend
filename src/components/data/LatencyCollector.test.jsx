/**
 * Latency collector timing tests — the elapsed value must come from the wall
 * clock, not from counting ticks, so throttled/suspended timers can't shrink
 * the recorded latency.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LatencyCollector from './LatencyCollector'

describe('LatencyCollector', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-07-17T10:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows elapsed seconds from the cue', () => {
        render(<LatencyCollector onRecord={vi.fn()} />)
        act(() => {
            screen.getByText(/Present Cue/i).click()
        })
        act(() => {
            vi.advanceTimersByTime(12_000)
        })
        expect(screen.getByText('00:12')).toBeInTheDocument()
    })

    it('records true wall-clock latency even when ticks were suspended', () => {
        const onRecord = vi.fn()
        render(<LatencyCollector onRecord={onRecord} />)
        act(() => {
            screen.getByText(/Present Cue/i).click()
        })

        // Screen locked for 40s: clock advances, no ticks fire.
        act(() => {
            vi.setSystemTime(new Date('2026-07-17T10:00:40Z'))
            document.dispatchEvent(new Event('visibilitychange'))
        })
        expect(screen.getByText('00:40')).toBeInTheDocument()

        act(() => {
            screen.getByText(/Behavior Began/i).click()
        })
        expect(onRecord).toHaveBeenCalledWith({ duration_seconds: 40 })
    })
})
