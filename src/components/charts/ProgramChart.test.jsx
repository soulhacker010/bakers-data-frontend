import { describe, it, expect, vi } from 'vitest'
import { cloneElement } from 'react'
import { render } from '@testing-library/react'

// jsdom performs no layout, so ResponsiveContainer measures 0x0 and renders
// nothing at all. Give the chart a real size so the SVG is actually produced,
// otherwise assertions about its contents pass without testing anything.
vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        ResponsiveContainer: ({ children }) => cloneElement(children, { width: 600, height: 300 }),
    }
})

import ProgramChart, { buildChartData, buildPhaseChanges, truncate } from './ProgramChart'

const analytics = {
    sessions: [
        { date: '2026-08-05', accuracy: 80, frequency_count: 12, session_minutes: 60 },
        { date: '2026-08-06', accuracy: 90, frequency_count: 6, session_minutes: null },
    ],
    targets: [],
    phase_changes: [],
}

describe('buildChartData', () => {
    it('maps each day onto a chart row', () => {
        const rows = buildChartData(analytics)
        expect(rows).toHaveLength(2)
        expect(rows[0].date).toBe('Aug 5')
        expect(rows[0].accuracy).toBe(80)
        expect(rows[0].frequency).toBe(12)
    })

    it('derives the rate from the day session time', () => {
        const rows = buildChartData(analytics)
        expect(rows[0].rate).toBe(0.2)
    })

    it('leaves the rate null when the day has no session time', () => {
        // The line skips that point rather than drawing a misleading zero.
        expect(buildChartData(analytics)[1].rate).toBeNull()
    })

    it('converts duration seconds to whole minutes', () => {
        const rows = buildChartData({ sessions: [{ date: '2026-08-05', total_duration_seconds: 150 }] })
        expect(rows[0].duration).toBe(3)
    })

    it('returns an empty list when there is nothing to chart', () => {
        expect(buildChartData(null)).toEqual([])
        expect(buildChartData({})).toEqual([])
    })

    it('parses dates at midday so a timezone offset cannot shift the day', () => {
        // Parsed at 00:00 a negative UTC offset would render this as Aug 4.
        expect(buildChartData({ sessions: [{ date: '2026-08-05' }] })[0].date).toBe('Aug 5')
    })
})

describe('buildPhaseChanges', () => {
    it('labels a transition with its date and both targets', () => {
        const [pc] = buildPhaseChanges({
            phase_changes: [{ date: '2026-08-05', from_target: 'Sitting', to_target: 'Standing' }],
        })
        expect(pc.dateLabel).toBe('Aug 5')
        expect(pc.chartLabel).toContain('Sitting')
        expect(pc.chartLabel).toContain('Standing')
    })

    it('reads as mastered when nothing follows it', () => {
        const [pc] = buildPhaseChanges({
            phase_changes: [{ date: '2026-08-05', from_target: 'Sitting' }],
        })
        expect(pc.chartLabel).toContain('mastered')
    })

    it('returns an empty list when there are none', () => {
        expect(buildPhaseChanges(null)).toEqual([])
    })
})

describe('truncate', () => {
    it('shortens a long target name', () => {
        expect(truncate('A really long target name here')).toHaveLength(18)
    })

    it('leaves a short name alone', () => {
        expect(truncate('Sitting')).toBe('Sitting')
    })

    it('handles a missing name', () => {
        expect(truncate(null)).toBe('')
    })
})

describe('ProgramChart gradient ids', () => {
    it('namespaces gradients per program so several charts can share a page', () => {
        // Fixed ids would collide: every chart on the page would pick up
        // whichever definition rendered first.
        const { container } = render(
            <div>
                <ProgramChart program={{ id: 1, data_type: 'trial' }} analytics={analytics} />
                <ProgramChart program={{ id: 2, data_type: 'trial' }} analytics={analytics} />
            </div>
        )
        const ids = [...container.querySelectorAll('linearGradient')].map(el => el.id)
        // Assert the count first, otherwise "all unique" would hold vacuously
        // if nothing rendered at all.
        expect(ids).toHaveLength(2)
        expect(new Set(ids).size).toBe(2)
    })

    it('shows an empty state rather than an axis when there is no data', () => {
        const { getByText } = render(
            <ProgramChart program={{ id: 1, data_type: 'trial' }} analytics={{ sessions: [] }} />
        )
        expect(getByText('No Session Data Yet')).toBeTruthy()
    })
})
