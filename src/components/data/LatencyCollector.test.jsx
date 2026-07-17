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
        // The shared test setup replaces sessionStorage with no-op stubs.
        // Run persistence across unmounts is under test here, so install a
        // faithful in-memory Storage.
        const store = new Map()
        global.sessionStorage = {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => { store.set(k, String(v)) },
            removeItem: (k) => { store.delete(k) },
            clear: () => { store.clear() },
        }
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

    it('keeps timing across a program switch (unmount/remount)', () => {
        const onRecord = vi.fn()
        const { unmount } = render(<LatencyCollector onRecord={onRecord} persistKey={7} />)
        act(() => {
            screen.getByText(/Present Cue/i).click()
        })
        unmount() // switched to another program mid-observation

        act(() => {
            vi.setSystemTime(new Date('2026-07-17T10:00:25Z'))
        })
        render(<LatencyCollector onRecord={onRecord} persistKey={7} />)

        expect(screen.getByText('00:25')).toBeInTheDocument()
        act(() => {
            screen.getByText(/Behavior Began/i).click()
        })
        expect(onRecord).toHaveBeenCalledWith({ duration_seconds: 25 })
    })
})
