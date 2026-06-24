/**
 * Friendly label for a target's measurement method, shown as a small badge on
 * target rows. Returns null when the target inherits the program default (no
 * per-target override) so no badge is rendered in that case.
 */
const METHOD_LABELS = {
    partial_interval: 'Partial Interval',
    whole_interval: 'Whole Interval',
    momentary_time_sampling: 'Momentary',
    latency: 'Latency',
}

const INTERVAL_METHODS = ['partial_interval', 'whole_interval', 'momentary_time_sampling']

export function measurementBadgeLabel(target) {
    const method = target?.measurement_type
    if (!method) return null
    const base = METHOD_LABELS[method] || method
    if (INTERVAL_METHODS.includes(method) && target?.interval_seconds) {
        return `${base} · ${target.interval_seconds}s`
    }
    return base
}
