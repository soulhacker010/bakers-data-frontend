import { describe, it, expect } from 'vitest'
import { responsesPerHour, formatRate } from './rate'

describe('responsesPerHour', () => {
    it('converts a count over session minutes into an hourly rate', () => {
        expect(responsesPerHour(12, 75)).toBe(9.6)
        expect(responsesPerHour(8, 10)).toBe(48)
    })

    it('reads back the count itself over a full hour', () => {
        expect(responsesPerHour(12, 60)).toBe(12)
    })

    it('rounds to two decimal places', () => {
        expect(responsesPerHour(1, 7)).toBe(8.57)
    })

    it('reports zero behaviours as a real rate of zero', () => {
        // No behaviours in forty minutes is a genuine clinical finding, not
        // missing data.
        expect(responsesPerHour(0, 40)).toBe(0)
    })

    it('returns null when there is no session time to divide by', () => {
        // Different from zero: without a duration there is no rate to show.
        expect(responsesPerHour(12, null)).toBeNull()
        expect(responsesPerHour(12, undefined)).toBeNull()
        expect(responsesPerHour(12, 0)).toBeNull()
    })

    it('returns null when there is no count', () => {
        expect(responsesPerHour(null, 30)).toBeNull()
        expect(responsesPerHour(undefined, 30)).toBeNull()
    })

    it('returns null for a negative duration', () => {
        expect(responsesPerHour(12, -5)).toBeNull()
    })
})

describe('formatRate', () => {
    it('labels the value per hour', () => {
        expect(formatRate(9.6)).toBe('9.6/hr')
        expect(formatRate(48)).toBe('48/hr')
        expect(formatRate(0)).toBe('0/hr')
    })

    it('shows nothing usable when there is no rate', () => {
        expect(formatRate(null)).toBe('No session time')
        expect(formatRate(undefined)).toBe('No session time')
    })
})
