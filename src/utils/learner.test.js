import { describe, it, expect } from 'vitest'
import { learnerName, learnerCaption, formatDateOfBirth } from './learner'

/**
 * Dena, 20 Aug 2026: "can we add full name and date of birth to each graphing
 * individually".
 *
 * Graphs leave the building. They are attached to insurance submissions and
 * filed in a learner's record, and until now an exported chart carried the
 * program name and nothing identifying the child it described.
 */

describe('learnerName', () => {
    it('joins the full name', () => {
        expect(learnerName({ first_name: 'Jordan', last_name: 'Miller' })).toBe('Jordan Miller')
    })

    it('copes with only one name recorded', () => {
        expect(learnerName({ first_name: 'Jordan' })).toBe('Jordan')
        expect(learnerName({ last_name: 'Miller' })).toBe('Miller')
    })

    it('returns nothing when there is no client', () => {
        expect(learnerName(null)).toBe('')
        expect(learnerName({})).toBe('')
    })
})

describe('formatDateOfBirth', () => {
    it('formats the date the way the rest of the app shows dates', () => {
        expect(formatDateOfBirth('2018-03-14')).toBe('Mar 14, 2018')
    })

    it('does not shift the date across a timezone boundary', () => {
        // A plain YYYY-MM-DD is parsed as UTC midnight, which in Eastern is the
        // previous evening. A birth date reported a day early on a clinical
        // document is not a cosmetic problem.
        expect(formatDateOfBirth('2018-01-01')).toBe('Jan 1, 2018')
        expect(formatDateOfBirth('2019-12-31')).toBe('Dec 31, 2019')
    })

    it('returns nothing when no date of birth is recorded', () => {
        expect(formatDateOfBirth(null)).toBe('')
        expect(formatDateOfBirth(undefined)).toBe('')
        expect(formatDateOfBirth('')).toBe('')
    })

    it('returns nothing rather than "Invalid Date" for unusable input', () => {
        expect(formatDateOfBirth('not a date')).toBe('')
    })
})

describe('learnerCaption', () => {
    it('names the learner and their date of birth', () => {
        expect(learnerCaption({ first_name: 'Jordan', last_name: 'Miller', date_of_birth: '2018-03-14' }))
            .toBe('Jordan Miller · DOB Mar 14, 2018')
    })

    it('drops the date of birth when none is recorded', () => {
        expect(learnerCaption({ first_name: 'Jordan', last_name: 'Miller' })).toBe('Jordan Miller')
    })

    it('returns nothing when there is no client', () => {
        expect(learnerCaption(null)).toBe('')
    })
})
