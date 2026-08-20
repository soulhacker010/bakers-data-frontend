import { describe, it, expect } from 'vitest'
import { phaseSeries } from './phaseSeries'

/**
 * Dena, 20 Aug 2026: "if a phase change line is put in, automatically not
 * connecting the dot over one phase to another".
 *
 * This is the single-subject design convention. A data path is never drawn
 * across a phase change line, because joining them implies the two conditions
 * are one continuous series when the whole point of the line is that they are
 * not comparable in that way.
 */

const rows = [
    { date: 'Aug 3', accuracy: 40 },
    { date: 'Aug 5', accuracy: 55 },
    { date: 'Aug 9', accuracy: 70 },
    { date: 'Aug 11', accuracy: 85 },
]

describe('phaseSeries', () => {
    it('draws one unbroken series when no phase line is placed', () => {
        const { keys } = phaseSeries(rows, [], 'accuracy')
        expect(keys).toEqual(['accuracy'])
    })

    it('leaves the values on their original key when unbroken', () => {
        // Nothing about a chart without phase lines should change.
        const { rows: out } = phaseSeries(rows, [], 'accuracy')
        expect(out.map((r) => r.accuracy)).toEqual([40, 55, 70, 85])
    })

    it('splits into two series either side of a phase line', () => {
        const { keys } = phaseSeries(rows, [{ dateLabel: 'Aug 9' }], 'accuracy')
        expect(keys).toHaveLength(2)
    })

    it('ends the first series before the phase line and starts the second on it', () => {
        const { rows: out, keys } = phaseSeries(rows, [{ dateLabel: 'Aug 9' }], 'accuracy')
        const [before, after] = keys

        expect(out.map((r) => r[before])).toEqual([40, 55, undefined, undefined])
        expect(out.map((r) => r[after])).toEqual([undefined, undefined, 70, 85])
    })

    it('handles a reversal design with two phase lines', () => {
        const { keys, rows: out } = phaseSeries(
            rows,
            [{ dateLabel: 'Aug 5' }, { dateLabel: 'Aug 11' }],
            'accuracy'
        )

        expect(keys).toHaveLength(3)
        expect(out.map((r) => r[keys[0]])).toEqual([40, undefined, undefined, undefined])
        expect(out.map((r) => r[keys[1]])).toEqual([undefined, 55, 70, undefined])
        expect(out.map((r) => r[keys[2]])).toEqual([undefined, undefined, undefined, 85])
    })

    it('produces a single series when the phase line sits on the first point', () => {
        // A baseline marker on day one leaves nothing before it. An empty
        // segment would render as a Line with no points and a stray legend.
        const { keys } = phaseSeries(rows, [{ dateLabel: 'Aug 3' }], 'accuracy')
        expect(keys).toHaveLength(1)
    })

    it('ignores a phase line that does not sit on a plotted day', () => {
        const { keys } = phaseSeries(rows, [{ dateLabel: 'Aug 25' }], 'accuracy')
        expect(keys).toEqual(['accuracy'])
    })

    it('keeps gaps in the data as gaps rather than filling them', () => {
        // A day with no rate is null and must stay absent from the series.
        const withGap = [
            { date: 'Aug 3', rate: 12 },
            { date: 'Aug 5', rate: null },
            { date: 'Aug 9', rate: 8 },
        ]
        const { rows: out, keys } = phaseSeries(withGap, [{ dateLabel: 'Aug 9' }], 'rate')
        expect(out[1][keys[0]]).toBeNull()
    })

    it('copes with nothing to plot', () => {
        expect(phaseSeries([], [{ dateLabel: 'Aug 9' }], 'accuracy')).toEqual({ rows: [], keys: ['accuracy'] })
        expect(phaseSeries(null, null, 'accuracy')).toEqual({ rows: [], keys: ['accuracy'] })
    })
})
