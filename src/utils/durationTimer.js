/**
 * Pure timing model for the session duration timer.
 *
 * Elapsed time is derived from wall-clock timestamps, never from counting
 * ticks. That makes the displayed value correct even when the browser
 * throttles background timers, and lets the value survive a page reload:
 * we persist the timestamps, then recompute elapsed on the way back in.
 *
 * No React, no storage, no `Date.now()` in here — every function that needs
 * the current time takes an explicit `now` (epoch ms) so the module is
 * fully deterministic and unit-testable.
 *
 * State shape (all times are epoch ms):
 *   {
 *     startedAt:     when the current running segment began, or null if paused
 *     lastTickAt:    last time a running timer was observed alive (heartbeat)
 *     accumulatedMs: time banked from previous run segments
 *     adjustmentMs:  net manual +/- correction (may be negative)
 *     isRunning:     boolean
 *   }
 */

// Beyond this gap between the last heartbeat and reopening, we do NOT assume
// the behavior kept happening — we restore paused and flag for review so an
// overnight-closed laptop can't produce a garbage multi-hour reading.
export const LONG_GAP_MS = 30 * 60 * 1000 // 30 minutes

export function createTimer() {
    return {
        startedAt: null,
        lastTickAt: null,
        accumulatedMs: 0,
        adjustmentMs: 0,
        isRunning: false,
    }
}

// Banked + currently-running time, WITHOUT the manual adjustment.
function baseMs(timer, now) {
    const running =
        timer.isRunning && timer.startedAt != null
            ? Math.max(0, now - timer.startedAt)
            : 0
    return timer.accumulatedMs + running
}

// Total displayed time in ms, including the manual adjustment, clamped >= 0.
function totalMs(timer, now) {
    return Math.max(0, baseMs(timer, now) + timer.adjustmentMs)
}

export function elapsedSeconds(timer, now) {
    return Math.floor(totalMs(timer, now) / 1000)
}

export function start(timer, now) {
    if (timer.isRunning) return timer
    return { ...timer, startedAt: now, lastTickAt: now, isRunning: true }
}

export function stop(timer, now) {
    if (!timer.isRunning || timer.startedAt == null) return timer
    return {
        ...timer,
        accumulatedMs: timer.accumulatedMs + Math.max(0, now - timer.startedAt),
        startedAt: null,
        lastTickAt: null,
        isRunning: false,
    }
}

export function reset() {
    return createTimer()
}

/**
 * Apply a manual +/- correction of `deltaSeconds`. Clamped so the displayed
 * value can never fall below zero, while staying intuitive: after being
 * clamped at zero, a following `+` raises the value predictably rather than
 * having to first "pay back" an invisible negative balance.
 */
export function adjust(timer, deltaSeconds, now) {
    const base = baseMs(timer, now)
    const deltaMs = deltaSeconds * 1000
    const prospectiveTotal = base + timer.adjustmentMs + deltaMs
    const adjustmentMs = prospectiveTotal < 0 ? -base : timer.adjustmentMs + deltaMs
    return { ...timer, adjustmentMs }
}

/**
 * Restore a timer loaded from storage.
 *
 * - Paused timer: returned unchanged.
 * - Running timer, short gap since last heartbeat (<= LONG_GAP_MS): keep it
 *   running through the downtime (accurate for a behavior that was still
 *   happening); staff can trim with `-` if it actually stopped.
 * - Running timer, long gap: bank only the legitimate pre-gap time and pause,
 *   returning flagged=true so the UI can ask the user to check it.
 *
 * Returns { timer, flagged }.
 */
export function hydrate(timer, now, maxGapMs = LONG_GAP_MS) {
    if (!timer.isRunning || timer.startedAt == null) {
        return { timer, flagged: false }
    }

    const anchor = timer.lastTickAt != null ? timer.lastTickAt : timer.startedAt
    const gap = now - anchor

    if (gap <= maxGapMs) {
        return { timer, flagged: false }
    }

    const banked = timer.accumulatedMs + Math.max(0, anchor - timer.startedAt)
    return {
        timer: {
            ...timer,
            accumulatedMs: banked,
            startedAt: null,
            lastTickAt: null,
            isRunning: false,
        },
        flagged: true,
    }
}
