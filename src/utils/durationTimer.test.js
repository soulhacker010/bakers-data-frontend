/**
 * Tests for the pure duration-timer timing model.
 *
 * The whole point of this module is that elapsed time is derived from
 * wall-clock timestamps (not from counting ticks), so it stays accurate
 * across tab-throttling, page reloads, and crashes. Every test passes an
 * explicit `now` so there is no reliance on the real clock.
 */
import { describe, it, expect } from 'vitest'
import {
    createTimer,
    elapsedSeconds,
    start,
    stop,
    reset,
    adjust,
    hydrate,
    LONG_GAP_MS,
} from './durationTimer'

const T0 = 1_000_000_000_000 // arbitrary fixed epoch ms
const sec = (n) => n * 1000

describe('createTimer', () => {
    it('starts paused at zero with no banked or adjusted time', () => {
        const t = createTimer()
        expect(t.isRunning).toBe(false)
        expect(elapsedSeconds(t, T0)).toBe(0)
    })
})

describe('elapsedSeconds while running', () => {
    it('counts real elapsed time from when it started, regardless of ticks', () => {
        const t = start(createTimer(), T0)
        // 42 seconds of wall-clock later — even if no ticks fired
        expect(elapsedSeconds(t, T0 + sec(42))).toBe(42)
    })

    it('is not affected by how often it is sampled (no tick drift)', () => {
        const t = start(createTimer(), T0)
        // sampling at 5 min out gives exactly 300s, not an under-count
        expect(elapsedSeconds(t, T0 + sec(300))).toBe(300)
    })
})

describe('stop / pause banks the running segment', () => {
    it('freezes the elapsed value when stopped', () => {
        let t = start(createTimer(), T0)
        t = stop(t, T0 + sec(30))
        expect(t.isRunning).toBe(false)
        // time no longer advances after stop
        expect(elapsedSeconds(t, T0 + sec(90))).toBe(30)
    })

    it('accumulates across multiple run segments', () => {
        let t = start(createTimer(), T0)
        t = stop(t, T0 + sec(20)) // banked 20
        t = start(t, T0 + sec(100)) // resume much later
        t = stop(t, T0 + sec(110)) // +10 => 30 total
        expect(elapsedSeconds(t, T0 + sec(999))).toBe(30)
    })
})

describe('reset', () => {
    it('returns the timer to a fresh zeroed paused state', () => {
        let t = start(createTimer(), T0)
        t = adjust(t, 15, T0 + sec(5))
        t = reset(t)
        expect(t.isRunning).toBe(false)
        expect(elapsedSeconds(t, T0 + sec(100))).toBe(0)
    })
})

describe('manual +/- adjustment', () => {
    it('adds time while paused', () => {
        let t = stop(start(createTimer(), T0), T0 + sec(30)) // 30s paused
        t = adjust(t, 5, T0 + sec(30))
        expect(elapsedSeconds(t, T0 + sec(30))).toBe(35)
    })

    it('adds time while running without stopping the clock', () => {
        let t = start(createTimer(), T0)
        t = adjust(t, 5, T0 + sec(10)) // at 10s, +5 => shows 15
        expect(elapsedSeconds(t, T0 + sec(10))).toBe(15)
        // and it keeps counting from there
        expect(elapsedSeconds(t, T0 + sec(12))).toBe(17)
    })

    it('subtracts time', () => {
        let t = stop(start(createTimer(), T0), T0 + sec(30))
        t = adjust(t, -5, T0 + sec(30))
        expect(elapsedSeconds(t, T0 + sec(30))).toBe(25)
    })

    it('never lets the displayed value go below zero', () => {
        let t = stop(start(createTimer(), T0), T0 + sec(3)) // 3s
        t = adjust(t, -10, T0 + sec(3)) // try to go to -7
        expect(elapsedSeconds(t, T0 + sec(3))).toBe(0)
    })

    it('recovers cleanly after being clamped at zero (+ brings it back up predictably)', () => {
        let t = stop(start(createTimer(), T0), T0 + sec(3))
        t = adjust(t, -10, T0 + sec(3)) // clamped to 0
        t = adjust(t, 5, T0 + sec(3)) // should be 5, not (3-10+5=-2 clamped)
        expect(elapsedSeconds(t, T0 + sec(3))).toBe(5)
    })
})

describe('hydrate — restoring after a page close / crash', () => {
    it('a paused timer restores unchanged and not flagged', () => {
        const saved = stop(start(createTimer(), T0), T0 + sec(30))
        const { timer, flagged } = hydrate(saved, T0 + sec(10_000))
        expect(flagged).toBe(false)
        expect(timer.isRunning).toBe(false)
        expect(elapsedSeconds(timer, T0 + sec(10_000))).toBe(30)
    })

    it('a short gap keeps counting through the downtime (Option A)', () => {
        // running, last heartbeat at T0+30s, reopened 60s later
        let saved = start(createTimer(), T0)
        saved = { ...saved, lastTickAt: T0 + sec(30) }
        const now = T0 + sec(90)
        const { timer, flagged } = hydrate(saved, now)
        expect(flagged).toBe(false)
        expect(timer.isRunning).toBe(true)
        // 90s of real time elapsed since start => 90
        expect(elapsedSeconds(timer, now)).toBe(90)
    })

    it('a long gap restores paused at the pre-gap value and flags for review', () => {
        // running since T0, last heartbeat at T0+120s, reopened 3 hours later
        let saved = start(createTimer(), T0)
        saved = { ...saved, lastTickAt: T0 + sec(120) }
        const now = T0 + LONG_GAP_MS + sec(120) + sec(5) // gap well over threshold
        const { timer, flagged } = hydrate(saved, now)
        expect(flagged).toBe(true)
        expect(timer.isRunning).toBe(false)
        // banked only the legitimate pre-gap time (~120s), not the 3h gap
        expect(elapsedSeconds(timer, now)).toBe(120)
    })
})
