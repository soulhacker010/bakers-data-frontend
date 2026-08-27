/**
 * Observing several behaviours against one interval clock.
 *
 * Dena (BCBA, Cor Behavioral), 20 Aug 2026:
 *   "can't open multiple partial intervals at a time"
 *
 * Interval recording ran a timer per target. The countdown is wall-clock based,
 * so starting a second behaviour and returning to the first found its intervals
 * already elapsed with nothing scored against them. Data went missing without
 * a word, which is worse than the limitation she reported.
 *
 * A paper interval sheet has intervals across the top and behaviours down the
 * side. One clock, and at the end of each interval the observer marks every
 * behaviour. That is what this models: it removes the second timer rather than
 * policing it, so both readings of her sentence end up satisfied.
 *
 * Pure state. The countdown, the beep and the wake lock stay in the component;
 * everything about what has been scored and what happens next lives here.
 */

/**
 * Stands in for a behaviour when the run belongs to the program itself: the
 * interval method is on program.data_type and there are no active targets to
 * score against. Scores under this id are persisted with target_id null.
 */
export const PROGRAM_LEVEL = '__program__'

/** Measurement methods that are scored off an interval countdown. */
const INTERVAL_METHODS = new Set([
    'partial_interval',
    'whole_interval',
    'momentary',
    'momentary_time_sampling',
])

export function createRun({ targetIds, intervalSeconds, totalIntervals }) {
    const ids = (targetIds || []).filter((id) => id != null)
    if (!ids.length) {
        throw new Error('An interval run needs at least one behaviour to observe')
    }

    return {
        targetIds: [...ids],
        intervalSeconds,
        totalIntervals,
        currentInterval: 1,
        scores: {},
    }
}

/** Behaviours still to be marked for the interval now being scored. */
export function pendingTargets(run) {
    if (isComplete(run)) return []

    const scored = run?.scores?.[run.currentInterval] || {}
    return (run?.targetIds || []).filter((id) => scored[id] == null)
}

export function isCurrentIntervalScored(run) {
    return pendingTargets(run).length === 0 && !isComplete(run)
}

export function isComplete(run) {
    if (!run) return false

    const last = run.scores?.[run.totalIntervals] || {}
    const allScored = (run.targetIds || []).every((id) => last[id] != null)

    return run.currentInterval >= run.totalIntervals && allScored
}

/**
 * Mark one behaviour for the current interval.
 *
 * Scoring the same behaviour twice overwrites rather than advancing, so a
 * therapist who taps the wrong row can correct it without the block moving on
 * underneath them. The interval only closes once every behaviour is marked.
 */
export function scoreTarget(run, targetId, result) {
    if (!run || !(run.targetIds || []).includes(targetId)) return run
    if (isComplete(run)) return run

    const interval = run.currentInterval
    const next = {
        ...run,
        scores: {
            ...run.scores,
            [interval]: { ...(run.scores[interval] || {}), [targetId]: result },
        },
    }

    const everyoneScored = next.targetIds.every((id) => next.scores[interval][id] != null)
    if (everyoneScored && interval < next.totalIntervals) {
        next.currentInterval = interval + 1
    }

    return next
}

/**
 * The behaviours that can share a clock with the chosen one.
 *
 * One countdown means one interval length, so a behaviour observed on sixty
 * seconds cannot be scored against a thirty second run. The method itself may
 * differ: partial and momentary describe when the observer looks, not how long
 * the interval lasts, and mixing them on one sheet is ordinary practice.
 */
export function observableTogether(targets, targetId, fallbackMethod = null) {
    const list = Array.isArray(targets) ? targets : []

    // measurement_type on a target is an OPTIONAL OVERRIDE (nullable in the
    // model). On an ordinary interval program the method lives on
    // program.data_type and every target leaves the field empty, so the
    // program's type has to stand in or nothing groups at all.
    const methodOf = (t) => t?.measurement_type || fallbackMethod

    // Falling back to the first target matters on the first render, before a
    // target has been auto-selected: without it the sheet renders blank.
    const chosen = list.find((t) => t.id === targetId) ?? list[0]

    if (!chosen || !INTERVAL_METHODS.has(methodOf(chosen))) return []

    return list.filter((t) => (
        INTERVAL_METHODS.has(methodOf(t))
        && (t.interval_seconds || null) === (chosen.interval_seconds || null)
    ))
}
