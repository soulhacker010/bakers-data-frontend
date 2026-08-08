import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import {
    parseServerTime,
    toZonedDate,
    CLINIC_TIME_ZONE,
    formatInZone,
    formatDateInZone,
    formatTimeInZone,
    formatDateTimeInZone,
} from './datetime'

describe('parseServerTime', () => {
    it('reads a naive server timestamp as UTC, not local time', () => {
        // The backend stores datetime.utcnow() and serializes without a zone
        // suffix. Read as local time, every timestamp on screen would be out
        // by the viewer's offset.
        expect(parseServerTime('2026-08-07T14:30:00')).toEqual(new Date(Date.UTC(2026, 7, 7, 14, 30)))
    })

    it('honours an explicit Z suffix', () => {
        expect(parseServerTime('2026-08-07T14:30:00Z')).toEqual(new Date(Date.UTC(2026, 7, 7, 14, 30)))
    })

    it('honours an explicit offset', () => {
        expect(parseServerTime('2026-08-07T10:30:00-04:00')).toEqual(new Date(Date.UTC(2026, 7, 7, 14, 30)))
    })

    it('passes a Date through unchanged', () => {
        const d = new Date(Date.UTC(2026, 7, 7, 14, 30))
        expect(parseServerTime(d)).toEqual(d)
    })

    it('returns null for missing or unparseable input', () => {
        expect(parseServerTime(null)).toBeNull()
        expect(parseServerTime('')).toBeNull()
        expect(parseServerTime('not a date')).toBeNull()
    })
})

describe('the clinic time zone', () => {
    it('defaults to US Eastern', () => {
        // Requested so that recorded times line up with what the practice
        // bills, in case of an audit.
        expect(CLINIC_TIME_ZONE).toBe('America/New_York')
    })
})

describe('toZonedDate', () => {
    it('carries the Eastern wall-clock reading so date-fns patterns are unchanged', () => {
        // 14:30 UTC is 10:30 in New York during daylight time.
        const d = toZonedDate('2026-08-07T14:30:00')
        expect(format(d, 'h:mm a')).toBe('10:30 AM')
        expect(format(d, 'MMMM d, yyyy')).toBe('August 7, 2026')
    })

    it('follows daylight saving', () => {
        expect(format(toZonedDate('2026-01-07T14:30:00'), 'h:mm a')).toBe('9:30 AM')
    })

    it('keeps a late-evening session on the right local day', () => {
        // 02:00 UTC on the 8th is 22:00 on the 7th in New York. Rendering the
        // raw UTC value would put the session on the wrong date entirely.
        expect(format(toZonedDate('2026-08-08T02:00:00'), 'MMMM d, yyyy')).toBe('August 7, 2026')
    })

    it('handles midnight without rolling to hour 24', () => {
        // 04:00 UTC is midnight in New York during daylight time.
        expect(format(toZonedDate('2026-08-07T04:00:00'), 'H:mm')).toBe('0:00')
    })

    it('returns null for unusable input so callers can skip formatting', () => {
        expect(toZonedDate(null)).toBeNull()
        expect(toZonedDate('nonsense')).toBeNull()
    })

    it('accepts an explicit zone', () => {
        expect(format(toZonedDate('2026-08-07T14:30:00', 'UTC'), 'h:mm a')).toBe('2:30 PM')
    })
})

describe('formatting in a zone', () => {
    // 14:30 UTC on 7 August is 10:30 in New York (daylight time, UTC-4).
    const summer = '2026-08-07T14:30:00'
    // 14:30 UTC on 7 January is 09:30 in New York (standard time, UTC-5).
    const winter = '2026-01-07T14:30:00'

    it('shifts a UTC timestamp into Eastern time', () => {
        expect(formatTimeInZone(summer)).toBe('10:30 AM')
    })

    it('follows daylight saving rather than assuming a fixed offset', () => {
        expect(formatTimeInZone(winter)).toBe('9:30 AM')
    })

    it('shows the date in the clinic zone', () => {
        expect(formatDateInZone(summer)).toBe('Aug 7, 2026')
    })

    it('keeps a late-evening UTC time on the correct local day', () => {
        // 02:00 UTC on 8 August is still 22:00 on 7 August in New York.
        // Formatting in UTC would report the wrong session date.
        expect(formatDateInZone('2026-08-08T02:00:00')).toBe('Aug 7, 2026')
    })

    it('combines date and time', () => {
        expect(formatDateTimeInZone(summer)).toBe('Aug 7, 2026, 10:30 AM')
    })

    it('accepts an explicit zone', () => {
        expect(formatTimeInZone(summer, { timeZone: 'UTC' })).toBe('2:30 PM')
    })

    it('returns an empty string rather than "Invalid Date" for bad input', () => {
        expect(formatDateInZone(null)).toBe('')
        expect(formatTimeInZone('nonsense')).toBe('')
        expect(formatDateTimeInZone(undefined)).toBe('')
    })

    it('exposes the underlying formatter for other patterns', () => {
        expect(formatInZone(summer, { year: 'numeric' })).toBe('2026')
    })
})
