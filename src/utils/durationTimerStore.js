/**
 * localStorage persistence for session duration timers.
 *
 * Timers are stored per session so a stale timer from an old session can
 * never bleed into a new one. Every access is wrapped so a storage failure
 * (private mode, quota, disabled storage) degrades gracefully to "no saved
 * timers" instead of crashing the live session page.
 *
 * The timer map is Map<programId(number), timerState>. JSON can't represent a
 * Map directly, so we serialize it as an array of [id, state] entries and
 * rebuild the Map (with numeric keys) on load.
 */

const PREFIX = 'dataSirena.durationTimers.v1.'

export function storageKey(sessionId) {
    return `${PREFIX}${sessionId}`
}

export function saveTimers(sessionId, timerMap) {
    try {
        const entries = Array.from(timerMap.entries())
        localStorage.setItem(storageKey(sessionId), JSON.stringify(entries))
    } catch {
        // Storage unavailable/full — fail soft; the in-memory timer keeps working.
    }
}

export function loadTimers(sessionId) {
    try {
        const raw = localStorage.getItem(storageKey(sessionId))
        if (!raw) return new Map()
        const entries = JSON.parse(raw)
        if (!Array.isArray(entries)) return new Map()
        // Keep only well-shaped entries; coerce ids back to numbers.
        const valid = entries.filter(
            (e) => Array.isArray(e) && e.length === 2 && e[1] && typeof e[1] === 'object'
        )
        return new Map(valid.map(([id, state]) => [Number(id), state]))
    } catch {
        return new Map()
    }
}

export function clearTimers(sessionId) {
    try {
        localStorage.removeItem(storageKey(sessionId))
    } catch {
        // ignore
    }
}
