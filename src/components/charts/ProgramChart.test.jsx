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

import ProgramChart, { buildChartData, buildPhaseChanges, resolvePhaseLines, truncate } from './ProgramChart'

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

    it('derives an hourly rate from the day session time', () => {
        // 12 responses across 60 recorded minutes reads back as 12 per hour.
        const rows = buildChartData(analytics)
        expect(rows[0].rate).toBe(12)
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

describe('resolvePhaseLines', () => {
    const rows = [
        { rawDate: '2026-08-03', date: 'Aug 3' },
        { rawDate: '2026-08-05', date: 'Aug 5' },
        { rawDate: '2026-08-09', date: 'Aug 9' },
    ]

    it('sits on the session date when the phase change falls on one', () => {
        const [line] = resolvePhaseLines([{ id: 1, title: 'FCT', date: '2026-08-05' }], rows)
        expect(line.dateLabel).toBe('Aug 5')
    })

    it('snaps to the first session after the phase change', () => {
        // The X axis is categorical, so a line can only be drawn where a
        // session exists. The first session of the new phase is also where a
        // clinician would expect the line.
        const [line] = resolvePhaseLines([{ id: 1, title: 'FCT', date: '2026-08-06' }], rows)
        expect(line.dateLabel).toBe('Aug 9')
    })

    it('falls back to the last session when dated after every one', () => {
        const [line] = resolvePhaseLines([{ id: 1, title: 'FCT', date: '2026-09-01' }], rows)
        expect(line.dateLabel).toBe('Aug 9')
    })

    it('sits on the first session when dated before every one', () => {
        const [line] = resolvePhaseLines([{ id: 1, title: 'Baseline', date: '2026-07-01' }], rows)
        expect(line.dateLabel).toBe('Aug 3')
    })

    it('handles a reversal design with several lines', () => {
        const lines = resolvePhaseLines([
            { id: 1, title: 'Baseline', date: '2026-08-03' },
            { id: 2, title: 'FCT', date: '2026-08-05' },
            { id: 3, title: 'Baseline', date: '2026-08-09' },
        ], rows)
        expect(lines.map(l => l.title)).toEqual(['Baseline', 'FCT', 'Baseline'])
        expect(lines.map(l => l.dateLabel)).toEqual(['Aug 3', 'Aug 5', 'Aug 9'])
    })

    it('draws nothing when there is no data to plot against', () => {
        expect(resolvePhaseLines([{ id: 1, title: 'FCT', date: '2026-08-05' }], [])).toEqual([])
        expect(resolvePhaseLines(null, rows)).toEqual([])
        expect(resolvePhaseLines([], rows)).toEqual([])
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
        // Rendering two full charts is heavier than the default 5s allows on a
        // loaded machine. The assertion is unchanged; only the patience is.
    }, 20000)

    it('leaves the mastery criteria off the chart by default', () => {
        // Dena, 20 Aug 2026: "confused as to what the horizontal orange lines
        // that remain on graphs - can this be removed off each (taking off
        // mastery criteria from graph)".
        const { container } = render(
            <ProgramChart
                program={{ id: 1, data_type: 'trial' }}
                analytics={{ ...analytics, targets: [{ id: 3, name: 'Sitting', mastery_threshold: 80, status: 'active' }] }}
            />
        )
        expect(container.textContent).not.toContain('Sitting (80%)')
    }, 20000)

    it('draws the mastery criteria when a supervisor asks for them', () => {
        // Kept rather than deleted: a threshold that silently vanishes is worse
        // than one that is confusing, and other supervisors read them.
        const { container } = render(
            <ProgramChart
                program={{ id: 1, data_type: 'trial' }}
                analytics={{ ...analytics, targets: [{ id: 3, name: 'Sitting', mastery_threshold: 80, status: 'active' }] }}
                showMasteryLines
            />
        )
        expect(container.textContent).toContain('Sitting (80%)')
    }, 20000)

    it('draws one continuous path when no phase line is placed', () => {
        const { container } = render(
            <ProgramChart program={{ id: 1, data_type: 'trial' }} analytics={analytics} />
        )
        expect(container.querySelectorAll('.recharts-area-curve')).toHaveLength(1)
    }, 20000)

    it('breaks the data path either side of a phase change line', () => {
        // Single-subject design convention, and Dena's request of 20 Aug 2026:
        // the path is never drawn across a phase change.
        const { container } = render(
            <ProgramChart
                program={{ id: 1, data_type: 'trial' }}
                analytics={{ ...analytics, phase_lines: [{ id: 1, title: 'FCT', date: '2026-08-06' }] }}
            />
        )
        expect(container.querySelectorAll('.recharts-area-curve')).toHaveLength(2)
    }, 20000)

    it('shows an empty state rather than an axis when there is no data', () => {
        const { getByText } = render(
            <ProgramChart program={{ id: 1, data_type: 'trial' }} analytics={{ sessions: [] }} />
        )
        expect(getByText('No Session Data Yet')).toBeTruthy()
    })
})
