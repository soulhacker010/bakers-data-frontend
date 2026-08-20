import { describe, it, expect } from 'vitest'
import { countAxisDomain, PERCENT_DOMAIN } from './chartAxis'

/**
 * Dena, 20 Aug 2026: "review Y axis to be either 0-10 or 0-100".
 *
 * Count, duration and latency charts were left to scale themselves, which
 * produced axes that started partway up and carried fractional ticks — 1.75
 * responses, read off a graph a supervisor signs.
 */

describe('PERCENT_DOMAIN', () => {
    it('pins percentage charts to the full scale', () => {
        expect(PERCENT_DOMAIN).toEqual([0, 100])
    })
})

describe('countAxisDomain', () => {
    it('always starts at zero, whatever the data', () => {
        // The important one. An axis that starts at 80 makes a two point
        // wobble look like a collapse, and these charts get read as evidence.
        expect(countAxisDomain([80, 95])[0]).toBe(0)
        expect(countAxisDomain([500, 512])[0]).toBe(0)
    })

    it('gives a small count a readable floor rather than a squashed axis', () => {
        expect(countAxisDomain([3, 7])).toEqual([0, 10])
        expect(countAxisDomain([1])).toEqual([0, 10])
    })

    it('uses zero to ten when there is no data at all', () => {
        expect(countAxisDomain([])).toEqual([0, 10])
        expect(countAxisDomain(undefined)).toEqual([0, 10])
    })

    it('rounds the top up to a whole number staff can read off', () => {
        expect(countAxisDomain([12])).toEqual([0, 15])
        expect(countAxisDomain([23])).toEqual([0, 25])
        expect(countAxisDomain([47])).toEqual([0, 50])
    })

    it('keeps a round maximum exactly where it is', () => {
        expect(countAxisDomain([10])).toEqual([0, 10])
        expect(countAxisDomain([100])).toEqual([0, 100])
    })

    it('scales past a hundred without absurd precision', () => {
        expect(countAxisDomain([137])).toEqual([0, 150])
        expect(countAxisDomain([612])).toEqual([0, 650])
    })

    it('never lets a fractional value produce a fractional ceiling', () => {
        expect(countAxisDomain([1.75])).toEqual([0, 10])
        expect(countAxisDomain([10.5])).toEqual([0, 15])
    })

    it('ignores gaps in the data', () => {
        // Days with no rate come through as null and must not be read as zero
        // or drag the axis calculation into NaN.
        expect(countAxisDomain([12, null, undefined, NaN])).toEqual([0, 15])
    })
})
