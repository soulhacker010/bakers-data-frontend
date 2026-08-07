/**
 * Reading a frequency count as a rate.
 *
 * A raw count is hard to compare across sessions of different lengths: eight
 * instances in ten minutes and eight in a full hour describe very different
 * behaviour. Rate is the count divided by the time observed, which is what the
 * clinical team asked for (Aug 2026).
 *
 * Session time comes from the analytics endpoint as `session_minutes`, already
 * totalled across every therapist who worked with the learner that day.
 */

/**
 * Responses per minute, to two decimal places.
 *
 * Returns null when no rate can honestly be calculated, which the chart shows
 * as a gap rather than as zero. Zero itself is a real result: no behaviours in
 * forty minutes is a clinical finding, not missing data.
 */
export function responsesPerMinute(count, minutes) {
    if (count == null || minutes == null) return null
    if (!(minutes > 0)) return null

    return Math.round((count / minutes) * 100) / 100
}

/** Label a rate for an axis or tooltip. */
export function formatRate(rate) {
    if (rate == null) return 'No session time'
    return `${rate}/min`
}
