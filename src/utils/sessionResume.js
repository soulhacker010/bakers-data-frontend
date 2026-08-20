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
export function zeroRecordedProgramIds(entries) {
    const list = Array.isArray(entries) ? entries : []
    return new Set(
        list
            .filter((d) => d.data_type === 'frequency' && d.count === 0)
            .map((d) => d.program_id)
    )
}
