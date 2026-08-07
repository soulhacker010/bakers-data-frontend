/**
 * Elapsed time for a therapy session, derived entirely from the session record
 * the server already keeps.
 *
 * The clock used to live in component state: it started at zero on mount and
 * counted ticks. That meant it restarted every time the page unmounted, which
 * staff hit whenever they switched pages, refreshed, or opened the wellness
 * check-in mid-session (reported by the clinical team, Aug 2026).
 *
 * The server already stores everything needed — `start_time`, `end_time` and
 * the pause bookkeeping — so the reading is recomputed from those on every
 * render instead of being accumulated locally. Nothing to persist, nothing to
 * lose: the same session read from two tabs shows the same time.
 *
 * As with `durationTimer.js`, no function calls `Date.now()` itself; the
 * caller passes `now` (epoch ms) so the module stays deterministic under test.
 */

/**
 * Parse a timestamp from the API into epoch ms.
 *
 * Session times are stored with `datetime.utcnow()` and serialized without a
 * timezone suffix (`2026-08-07T14:30:00`). `new Date()` reads a bare string
 * like that as LOCAL time, which would put the clock out by the viewer's UTC
 * offset — five hours for the clinic using this. Append `Z` when no offset is
 * present so it is always read as UTC.
 */
export function parseServerTime(value) {
    if (!value || typeof value !== 'string') return null

    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    const ms = Date.parse(hasZone ? value : `${value}Z`)

    return Number.isNaN(ms) ? null : ms
}

/**
 * Seconds of active session time, excluding any time spent paused.
 *
 * @param {object|null} session - session record from the API
 * @param {number} now - current time, epoch ms
 */
export function sessionElapsedSeconds(session, now) {
    const startedAt = parseServerTime(session?.start_time)
    if (startedAt == null) return 0

    // A finished session is fixed at its end time rather than still running.
    const endedAt = parseServerTime(session?.end_time)
    const upTo = endedAt != null ? endedAt : now

    let elapsedMs = upTo - startedAt

    // Pauses already closed out and banked by the server on resume.
    elapsedMs -= (session.total_paused_seconds || 0) * 1000

    // A pause still open right now: the server has not banked it yet, so hold
    // the reading steady by subtracting the time since it began.
    if (session.is_paused) {
        const pausedAt = parseServerTime(session.pause_started_at)
        if (pausedAt != null) {
            elapsedMs -= Math.max(0, upTo - pausedAt)
        }
    }

    // Guard against a device clock behind the server's, which would otherwise
    // show a session counting backwards.
    return Math.max(0, Math.floor(elapsedMs / 1000))
}

/** Format seconds as HH:MM:SS, counting past 24 hours rather than wrapping. */
export function formatClock(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds || 0))
    const hrs = Math.floor(safe / 3600)
    const mins = Math.floor((safe % 3600) / 60)
    const secs = safe % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
}
