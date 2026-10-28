import { describe, it, expect } from 'vitest'
import { pastEntryField, pastEntryPayload } from './pastEntry'

/**
 * Dena (BCBA, Cor Behavioral), 28 Oct 2026:
 *   "When we input previous data, it only allows us to input percentages, even
 *    on duration or rate graphs."
 *
 * The form was built for trial programs and asked for a percentage whatever the
 * program recorded. A frequency program counts occurrences and a duration
 * program counts seconds, so a clinician filling in a missed session on either
 * had nothing truthful to type.
 */
describe('pastEntryField', () => {
    it('asks a trial program for a percentage', () => {
        expect(pastEntryField('trial').key).toBe('percentage')
    })

    it('asks a task analysis for a percentage, which is how it is charted', () => {
        expect(pastEntryField('task_analysis').key).toBe('percentage')
    })

    it('asks a frequency program for a count', () => {
        const field = pastEntryField('frequency')

        expect(field.key).toBe('count')
        expect(field.label).toMatch(/occurrence|count/i)
    })

    it('asks a duration program for seconds', () => {
        const field = pastEntryField('duration')

        expect(field.key).toBe('duration_seconds')
        expect(field.label).toMatch(/second/i)
    })

    it('caps a percentage at a hundred, and leaves a count uncapped', () => {
        expect(pastEntryField('trial').max).toBe(100)
        expect(pastEntryField('frequency').max).toBeUndefined()
    })

    it('falls back to a percentage for a type it does not know', () => {
        // Interval programs are charted as a percentage, and an unknown type
        // asking for the wrong thing is refused by the server anyway.
        expect(pastEntryField('partial_interval').key).toBe('percentage')
        expect(pastEntryField(undefined).key).toBe('percentage')
    })
})

describe('pastEntryPayload', () => {
    const base = { clientId: 3, programId: 9, date: '2026-10-07', notes: null, targetId: null }

    it('sends a percentage under its own name', () => {
        const body = pastEntryPayload({ ...base, dataType: 'trial', value: '80' })

        expect(body.percentage).toBe(80)
        expect(body.count).toBeUndefined()
        expect(body.duration_seconds).toBeUndefined()
    })

    it('sends a count under its own name', () => {
        const body = pastEntryPayload({ ...base, dataType: 'frequency', value: '12' })

        expect(body.count).toBe(12)
        expect(body.percentage).toBeUndefined()
    })

    it('sends seconds under their own name', () => {
        const body = pastEntryPayload({ ...base, dataType: 'duration', value: '180' })

        expect(body.duration_seconds).toBe(180)
        expect(body.percentage).toBeUndefined()
    })

    it('carries the target so the entry can count toward mastery', () => {
        const body = pastEntryPayload({ ...base, dataType: 'trial', value: '80', targetId: 4 })

        expect(body.target_id).toBe(4)
    })

    it('rounds a count to a whole number, since half an occurrence is not a thing', () => {
        expect(pastEntryPayload({ ...base, dataType: 'frequency', value: '12.6' }).count).toBe(13)
    })

    it('rejects a value that is not a number', () => {
        expect(() => pastEntryPayload({ ...base, dataType: 'trial', value: '' })).toThrow()
        expect(() => pastEntryPayload({ ...base, dataType: 'trial', value: 'abc' })).toThrow()
    })

    it('rejects a percentage over a hundred but allows a large count', () => {
        expect(() => pastEntryPayload({ ...base, dataType: 'trial', value: '140' })).toThrow()
        expect(pastEntryPayload({ ...base, dataType: 'frequency', value: '140' }).count).toBe(140)
    })

    it('rejects a negative figure of any kind', () => {
        expect(() => pastEntryPayload({ ...base, dataType: 'duration', value: '-5' })).toThrow()
    })
})
