/**
 * Showing recorded times in the practice's own time zone.
 *
 * Dena (BCBA, Cor Behavioral), Aug 2026:
 *   "Set the time to Eastern Standard Time so it can align with what we are
 *    billing in case of an audit."
 *
 * Two separate problems sit behind that request, and both are handled here.
 *
 * 1. The backend stores times with `datetime.utcnow()` and serializes them
 *    without a zone suffix, e.g. "2026-08-07T14:30:00". JavaScript reads a
 *    bare string like that as LOCAL time, so every timestamp on screen was
 *    already being read as though UTC were the viewer's own clock.
 *
 * 2. Even parsed correctly, a UTC time is not what the practice bills against.
 *    A session at 22:00 in New York is recorded as 02:00 the following day in
 *    UTC, so formatting without a zone reports the wrong session date.
 *
 * Storage stays UTC, which is correct. Only presentation moves.
 *
 * Uses the platform's own Intl support rather than adding a dependency, so
 * daylight saving is handled properly instead of assuming a fixed offset.
 */

/** The practice operates on US Eastern. */
export const CLINIC_TIME_ZONE = 'America/New_York'

/**
 * Parse a timestamp from the API into a Date.
 *
 * Appends `Z` when the string carries no zone information, so a naive server
 * timestamp is read as UTC rather than as the viewer's local time.
 */
export function parseServerTime(value) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value
    }
    if (!value || typeof value !== 'string') return null

    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    const parsed = new Date(hasZone ? value : `${value}Z`)

    return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Shift a server timestamp into the clinic's zone, as a Date carrying that
 * zone's wall-clock reading.
 *
 * This exists so the many existing `format(new Date(x), 'h:mm a')` call sites
 * can become `format(toZonedDate(x), 'h:mm a')` without any pattern changing.
 * Rewriting every pattern into Intl options would have altered how dates look
 * across the app, which is not what was asked for.
 *
 * The returned Date is only meaningful for display. Its underlying instant is
 * deliberately wrong by the zone offset, which is the point: date-fns reads it
 * with local getters and so renders the Eastern reading.
 */
export function toZonedDate(value, timeZone = CLINIC_TIME_ZONE) {
    const date = parseServerTime(value)
    if (!date) return null

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    }).formatToParts(date).reduce((acc, p) => {
        if (p.type !== 'literal') acc[p.type] = p.value
        return acc
    }, {})

    return new Date(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        // Some engines report midnight as hour 24 under hour12:false.
        Number(parts.hour) % 24,
        Number(parts.minute),
        Number(parts.second),
    )
}

/**
 * Format a server timestamp using Intl options, in the clinic's zone.
 *
 * Returns an empty string for anything unparseable, so a missing value renders
 * as a gap rather than as "Invalid Date" in front of a clinician.
 */
export function formatInZone(value, options = {}) {
    const date = parseServerTime(value)
    if (!date) return ''

    const { timeZone = CLINIC_TIME_ZONE, locale = 'en-US', ...rest } = options
    return new Intl.DateTimeFormat(locale, { timeZone, ...rest }).format(date)
}

/** e.g. "Aug 7, 2026" */
export function formatDateInZone(value, options = {}) {
    return formatInZone(value, { month: 'short', day: 'numeric', year: 'numeric', ...options })
}

/** e.g. "10:30 AM" */
export function formatTimeInZone(value, options = {}) {
    return formatInZone(value, { hour: 'numeric', minute: '2-digit', ...options })
}

/** e.g. "Aug 7, 2026, 10:30 AM" */
export function formatDateTimeInZone(value, options = {}) {
    return formatInZone(value, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
        ...options,
    })
}
