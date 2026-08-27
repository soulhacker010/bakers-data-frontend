import { describe, it, expect } from 'vitest'
import {
    createRun,
    pendingTargets,
    scoreTarget,
    isCurrentIntervalScored,
    isComplete,
    observableTogether,
} from './intervalRun'

/**
 * Dena, 20 Aug 2026: "can't open multiple partial intervals at a time".
 *
 * Interval recording ran one timer per target. The countdown is wall-clock, so
 * starting a second behaviour and coming back to the first found its intervals
 * already elapsed with nothing scored against them — data disappearing without
 * a word.
 *
 * A paper interval sheet has intervals across the top and behaviours down the
 * side: one clock, every behaviour scored at each interval. That is what this
 * models, and it removes the second timer rather than policing it.
 */

const run3 = () => createRun({ targetIds: [1, 2], intervalSeconds: 30, totalIntervals: 3 })

describe('createRun', () => {
    it('starts on the first interval with nothing scored', () => {
        const run = run3()
        expect(run.currentInterval).toBe(1)
        expect(pendingTargets(run)).toEqual([1, 2])
    })

    it('refuses a run with no behaviours to observe', () => {
        expect(() => createRun({ targetIds: [], intervalSeconds: 30, totalIntervals: 3 }))
            .toThrow()
    })
})

describe('scoring an interval', () => {
    it('waits for every behaviour before the interval counts as done', () => {
        const run = scoreTarget(run3(), 1, 'present')

        expect(isCurrentIntervalScored(run)).toBe(false)
        expect(pendingTargets(run)).toEqual([2])
        expect(run.currentInterval).toBe(1)
    })

    it('moves to the next interval once every behaviour is scored', () => {
        let run = run3()
        run = scoreTarget(run, 1, 'present')
        run = scoreTarget(run, 2, 'absent')

        expect(run.currentInterval).toBe(2)
        expect(pendingTargets(run)).toEqual([1, 2])
    })

    it('keeps what was scored against the interval it belonged to', () => {
        let run = run3()
        run = scoreTarget(run, 1, 'present')
        run = scoreTarget(run, 2, 'absent')
        run = scoreTarget(run, 1, 'absent')

        expect(run.scores[1]).toEqual({ 1: 'present', 2: 'absent' })
        expect(run.scores[2]).toEqual({ 1: 'absent' })
    })

    it('lets a mis-tap be corrected before the interval closes', () => {
        // Scoring the same behaviour twice in one interval overwrites rather
        // than advancing. A therapist tapping the wrong row must be able to fix
        // it without the block moving on underneath them.
        let run = run3()
        run = scoreTarget(run, 1, 'present')
        run = scoreTarget(run, 1, 'absent')

        expect(run.currentInterval).toBe(1)
        expect(run.scores[1]).toEqual({ 1: 'absent' })
        expect(pendingTargets(run)).toEqual([2])
    })

    it('ignores a behaviour that is not part of the run', () => {
        const run = scoreTarget(run3(), 99, 'present')
        expect(pendingTargets(run)).toEqual([1, 2])
    })

    it('does not mutate the run it was given', () => {
        const before = run3()
        scoreTarget(before, 1, 'present')
        expect(pendingTargets(before)).toEqual([1, 2])
    })
})

describe('finishing', () => {
    const complete = () => {
        let run = run3()
        for (let i = 0; i < 3; i += 1) {
            run = scoreTarget(run, 1, 'present')
            run = scoreTarget(run, 2, 'absent')
        }
        return run
    }

    it('is not complete while intervals remain', () => {
        let run = run3()
        run = scoreTarget(run, 1, 'present')
        run = scoreTarget(run, 2, 'absent')
        expect(isComplete(run)).toBe(false)
    })

    it('is complete once the last interval is scored', () => {
        expect(isComplete(complete())).toBe(true)
    })

    it('does not run past the last interval', () => {
        expect(complete().currentInterval).toBe(3)
    })

    it('has nothing pending when complete', () => {
        expect(pendingTargets(complete())).toEqual([])
    })
})

describe('observableTogether', () => {
    const targets = [
        { id: 1, name: 'Flapping', measurement_type: 'partial_interval', interval_seconds: 30 },
        { id: 2, name: 'Out of seat', measurement_type: 'partial_interval', interval_seconds: 30 },
        { id: 3, name: 'Humming', measurement_type: 'momentary', interval_seconds: 30 },
        { id: 4, name: 'Slow interval', measurement_type: 'partial_interval', interval_seconds: 60 },
        { id: 5, name: 'Greeting', measurement_type: 'trial', interval_seconds: null },
    ]

    it('groups behaviours that share an interval length', () => {
        // One clock means one interval length. Behaviours on 30 seconds and on
        // 60 seconds cannot be scored against the same countdown.
        expect(observableTogether(targets, 1).map((t) => t.id)).toEqual([1, 2, 3])
    })

    it('allows different interval methods on the same clock', () => {
        // Partial and momentary differ in when the observer looks, not in how
        // long the interval runs. Both are scored off the same countdown, which
        // is how a multi-behaviour paper sheet works.
        expect(observableTogether(targets, 1).map((t) => t.id)).toContain(3)
    })

    it('leaves out a behaviour on a different interval length', () => {
        expect(observableTogether(targets, 1).map((t) => t.id)).not.toContain(4)
    })

    it('leaves out anything that is not interval recording', () => {
        expect(observableTogether(targets, 1).map((t) => t.id)).not.toContain(5)
    })

    it('returns nothing when the chosen behaviour is not an interval target', () => {
        expect(observableTogether(targets, 5)).toEqual([])
    })

    /**
     * Dr Joe, 27 Aug 2026: "The partial interval function is not showing up
     * for staff to use."
     *
     * measurement_type on a target is an OPTIONAL OVERRIDE (nullable in the
     * model). For an ordinary interval program the method lives on
     * program.data_type and every target leaves it empty, so grouping purely on
     * the target's own field found nothing and the sheet rendered blank.
     */
    describe('when the method lives on the program instead of the target', () => {
        const plain = [
            { id: 1, name: 'Flapping', measurement_type: null, interval_seconds: 30 },
            { id: 2, name: 'Out of seat', measurement_type: null, interval_seconds: 30 },
        ]

        it('groups targets that inherit the interval method from the program', () => {
            expect(observableTogether(plain, 1, 'partial_interval').map((t) => t.id)).toEqual([1, 2])
        })

        it('still finds the group when no target has been chosen yet', () => {
            expect(observableTogether(plain, null, 'partial_interval').map((t) => t.id)).toEqual([1, 2])
        })

        it('lets a target override the program method', () => {
            const mixed = [
                { id: 1, name: 'Flapping', measurement_type: null, interval_seconds: 30 },
                { id: 2, name: 'Greeting', measurement_type: 'trial', interval_seconds: 30 },
            ]
            expect(observableTogether(mixed, 1, 'partial_interval').map((t) => t.id)).toEqual([1])
        })

        it('groups nothing when the program is not an interval program', () => {
            expect(observableTogether(plain, 1, 'frequency')).toEqual([])
        })
    })

    it('copes with no targets at all', () => {
        expect(observableTogether([], 1)).toEqual([])
        expect(observableTogether(null, 1)).toEqual([])
    })
})
