import { describe, it, expect } from 'vitest'
import { responsesPerMinute, formatRate } from './rate'

describe('responsesPerMinute', () => {
    it('divides the count by the session time', () => {
        expect(responsesPerMinute(12, 75)).toBe(0.16)
        expect(responsesPerMinute(8, 10)).toBe(0.8)
    })

    it('rounds to two decimal places', () => {
        expect(responsesPerMinute(1, 3)).toBe(0.33)
    })

    it('keeps a rate above one intact', () => {
        expect(responsesPerMinute(90, 30)).toBe(3)
    })

    it('reports zero behaviours as a real rate of zero', () => {
        // No behaviours in forty minutes is a genuine clinical finding, not
        // missing data.
        expect(responsesPerMinute(0, 40)).toBe(0)
    })

    it('returns null when there is no session time to divide by', () => {
        // Different from zero: without a duration there is no rate to show.
        expect(responsesPerMinute(12, null)).toBeNull()
        expect(responsesPerMinute(12, undefined)).toBeNull()
        expect(responsesPerMinute(12, 0)).toBeNull()
    })

    it('returns null when there is no count', () => {
        expect(responsesPerMinute(null, 30)).toBeNull()
        expect(responsesPerMinute(undefined, 30)).toBeNull()
    })

    it('returns null for a negative duration', () => {
        expect(responsesPerMinute(12, -5)).toBeNull()
    })
})

describe('formatRate', () => {
    it('labels the value per minute', () => {
        expect(formatRate(0.16)).toBe('0.16/min')
        expect(formatRate(3)).toBe('3/min')
        expect(formatRate(0)).toBe('0/min')
    })

    it('shows nothing usable when there is no rate', () => {
        expect(formatRate(null)).toBe('No session time')
        expect(formatRate(undefined)).toBe('No session time')
    })
})
