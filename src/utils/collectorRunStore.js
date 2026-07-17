/**
 * Per-tab persistence for in-progress collector runs (interval blocks,
 * latency observations).
 *
 * Collectors are unmounted whenever the therapist switches program or target
 * in the session sidebar — which happens constantly mid-session (e.g. while a
 * 5-minute whole-interval block is counting down, staff record trial data on
 * another program). Component state dies with the unmount, so an in-progress
 * block must live here instead, keyed by target.
 *
 * sessionStorage on purpose: survives remounts and page reloads within the
 * tab, but a closed tab ends the session and shouldn't resurrect stale
 * blocks the next day. All storage access fails soft.
 */
const PREFIX = 'collector_run:'

export function loadRun(key) {
    if (key == null) return null
    try {
        const raw = sessionStorage.getItem(PREFIX + key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function saveRun(key, state) {
    if (key == null) return
    try {
        sessionStorage.setItem(PREFIX + key, JSON.stringify(state))
    } catch { /* storage unavailable/full — run continues in memory */ }
}

export function clearRun(key) {
    if (key == null) return
    try {
        sessionStorage.removeItem(PREFIX + key)
    } catch { /* ignore */ }
}
