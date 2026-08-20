import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import IntervalCollector from './IntervalCollector'

/**
 * Dena, 20 Aug 2026: "can't open multiple partial intervals at a time".
 *
 * Several behaviours now share one countdown and are scored together at each
 * interval, the way a paper interval sheet works.
 */

const target = (id, name) => ({
    id,
    name,
    measurement_type: 'partial_interval',
    interval_seconds: 30,
    interval_count: 3,
})

const two = [target(1, 'Flapping'), target(2, 'Out of seat')]

const elapseInterval = () => act(() => { vi.advanceTimersByTime(31_000) })

describe('IntervalCollector with several behaviours', () => {
    let onRecord

    beforeEach(() => {
        vi.useFakeTimers()
        sessionStorage.clear()
        onRecord = vi.fn()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const start = (targets = two) => {
        render(<IntervalCollector targets={targets} onRecord={onRecord} />)
        fireEvent.click(screen.getByRole('button', { name: /Start Intervals/i }))
        elapseInterval()
    }

    it('offers a row for every behaviour once the interval ends', () => {
        start()

        expect(screen.getByLabelText('Flapping yes')).toBeTruthy()
        expect(screen.getByLabelText('Out of seat yes')).toBeTruthy()
    })

    it('records the behaviour that was marked, not just the interval', () => {
        // One row per behaviour per interval. Without target_id the scores
        // would all land against whichever target happened to be selected.
        start()
        fireEvent.click(screen.getByLabelText('Flapping yes'))

        expect(onRecord).toHaveBeenCalledWith(
            expect.objectContaining({ result: 'present', interval_index: 1, target_id: 1 })
        )
    })

    it('holds the interval open until every behaviour is marked', () => {
        start()
        fireEvent.click(screen.getByLabelText('Flapping yes'))

        expect(screen.getByText(/Interval 1 of 3/)).toBeTruthy()
        expect(screen.getByText(/1 of 2 still to mark/)).toBeTruthy()
    })

    it('moves on only when the last behaviour is marked', () => {
        start()
        fireEvent.click(screen.getByLabelText('Flapping yes'))
        fireEvent.click(screen.getByLabelText('Out of seat no'))

        expect(screen.getByText(/Interval 2 of 3/)).toBeTruthy()
    })

    it('scores nothing by omission', () => {
        // The old behaviour: a second timer ran unattended and its intervals
        // elapsed unscored. Two behaviours, one interval, two records.
        start()
        fireEvent.click(screen.getByLabelText('Flapping yes'))
        fireEvent.click(screen.getByLabelText('Out of seat no'))

        expect(onRecord).toHaveBeenCalledTimes(2)
    })

    it('keeps one countdown rather than one per behaviour', () => {
        start()
        expect(screen.getAllByText(/Interval \d of 3/)).toHaveLength(1)
    })
})

describe('IntervalCollector with a single behaviour', () => {
    let onRecord

    beforeEach(() => {
        vi.useFakeTimers()
        sessionStorage.clear()
        onRecord = vi.fn()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('keeps the large single-tap buttons', () => {
        // A tablet in a therapy room. One behaviour must not lose the big
        // targets just because the multi-behaviour case exists.
        render(<IntervalCollector targets={[target(1, 'Flapping')]} onRecord={onRecord} />)
        fireEvent.click(screen.getByRole('button', { name: /Start Intervals/i }))
        elapseInterval()

        expect(screen.getByText(/Did the behavior occur at ANY point/)).toBeTruthy()
    })

    it('still carries the behaviour on the record', () => {
        render(<IntervalCollector targets={[target(1, 'Flapping')]} onRecord={onRecord} />)
        fireEvent.click(screen.getByRole('button', { name: /Start Intervals/i }))
        elapseInterval()
        fireEvent.click(screen.getByLabelText('Flapping yes'))

        expect(onRecord).toHaveBeenCalledWith(
            expect.objectContaining({ result: 'present', interval_index: 1, target_id: 1 })
        )
    })

    it('renders nothing when there is no behaviour to observe', () => {
        const { container } = render(<IntervalCollector targets={[]} onRecord={onRecord} />)
        expect(container.firstChild).toBeNull()
    })
})
