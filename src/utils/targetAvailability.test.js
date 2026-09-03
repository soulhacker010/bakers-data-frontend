import { describe, it, expect } from 'vitest'
import { unavailableTargetsNotice } from './targetAvailability'

/**
 * Dena (BCBA, Cor Behavioral), 3 Sept 2026:
 *   "none of the client targets are showing up"
 *
 * The session screen lists only targets whose status is 'active', so a target
 * that has been mastered or put on hold drops off it. That part is deliberate.
 * Saying nothing about it is not: the sidebar simply emptied, which reads as
 * the program being broken and lost her a working day to a support thread.
 */

const target = (status) => ({ id: Math.random(), name: 'A Target', status })

describe('unavailableTargetsNotice', () => {
    it('says nothing while a target is still collectable', () => {
        expect(unavailableTargetsNotice([target('active'), target('mastered')])).toBeNull()
    })

    it('says nothing when the program has no targets at all', () => {
        // Frequency and duration programs are collected against the program
        // itself and legitimately carry no targets. Telling that clinician
        // something is missing would be inventing a problem.
        expect(unavailableTargetsNotice([])).toBeNull()
        expect(unavailableTargetsNotice(null)).toBeNull()
        expect(unavailableTargetsNotice(undefined)).toBeNull()
    })

    it('names mastery when every target has been mastered', () => {
        const notice = unavailableTargetsNotice([target('mastered'), target('mastered')])

        expect(notice.title).toMatch(/mastered/i)
        expect(notice.detail).toMatch(/set .* back to active|program page/i)
    })

    it('names being on hold when that is what happened', () => {
        const notice = unavailableTargetsNotice([target('on-hold')])

        expect(notice.title).toMatch(/on hold/i)
    })

    it('stays general when the targets are inactive for different reasons', () => {
        const notice = unavailableTargetsNotice([target('mastered'), target('on-hold')])

        expect(notice.title).toMatch(/no targets/i)
        expect(notice.title).not.toMatch(/mastered/i)
    })

    it('counts the targets so the clinician knows nothing was deleted', () => {
        expect(unavailableTargetsNotice([target('mastered'), target('mastered')]).count).toBe(2)
    })

    it('treats an unrecognised status as inactive rather than collectable', () => {
        // Guarding the direction that matters: a status this code has not seen
        // must not be assumed safe to collect against.
        const notice = unavailableTargetsNotice([target('retired')])

        expect(notice).not.toBeNull()
        expect(notice.title).toMatch(/no targets/i)
    })
})
