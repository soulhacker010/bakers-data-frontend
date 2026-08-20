/**
 * Rebuilding the collection screen when a session is resumed.
 *
 * Every tap is posted to the server as it happens, so a session in progress is
 * never at risk. What was missing is the other half: on returning to the page
 * — after a wellness check-in, a refresh, or the tablet locking — nothing asked
 * the server for the entries already collected, so the tallies came back at
 * zero and the session read as though it had restarted.
 *
 * These helpers turn the session record the server returns into the state the
 * page starts from.
 */

import { toZonedDate, parseServerTime } from './datetime'

/**
 * Data points already recorded against this session.
 * The server filters out soft-deleted rows, so what arrives is what counts.
 */
export function restoredEntries(session) {
    const data = session?.data
    return Array.isArray(data) ? data : []
}

/**
 * Notes typed earlier in the session.
 *
 * Empty string rather than null: this value is bound to a textarea and is
 * written back to the server when the session ends, so a blank must be a blank
 * string and never a null that would overwrite what was already saved.
 */
export function restoredNotes(session) {
    return session?.notes ?? ''
}

/**
 * Programs where the clinician already recorded an explicit zero, meaning the
 * behaviour was watched for and did not occur. Stored as an ordinary frequency
 * entry with a count of zero, so it can be read straight back off the entries
 * rather than tracked separately.
 */
/** Which clinic day a timestamp falls on, in the practice's own zone. */
function clinicDayKey(value) {
    const date = toZonedDate(value)
    if (!date) return null
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/**
 * The session already open that starting collection should continue instead of
 * opening another one.
 *
 * Deliberately narrow. A session qualifies only when it has not been ended, was
 * started by the person now asking, and belongs to today's clinic day. Anything
 * looser risks appending today's data to a record that was closed in spirit but
 * never closed in the app, or handing one therapist another's open session.
 *
 * A session left running from an earlier day is not resumed. It stays open and
 * visible, which is a problem for someone to see and end, not one to bury by
 * quietly writing more data into it.
 */
export function findResumableSession(sessions, { userId, now = new Date() } = {}) {
    if (userId == null) return null

    const today = clinicDayKey(now)
    if (!today) return null

    const open = (Array.isArray(sessions) ? sessions : []).filter((s) => (
        !s?.end_time
        && s?.user_id === userId
        && clinicDayKey(s?.start_time) === today
    ))

    if (!open.length) return null

    const startedAt = (s) => parseServerTime(s.start_time)?.getTime() ?? 0
    return open.reduce((latest, s) => (startedAt(s) > startedAt(latest) ? s : latest))
}

export function zeroRecordedProgramIds(entries) {
    const list = Array.isArray(entries) ? entries : []
    return new Set(
        list
            .filter((d) => d.data_type === 'frequency' && d.count === 0)
            .map((d) => d.program_id)
    )
}
