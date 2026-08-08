import { describe, it, expect } from 'vitest'
import { canAmendData, canSuperviseData } from './permissions'

const user = (role, flags = {}) => ({ role, ...flags })

describe('canAmendData', () => {
    it('allows a BCBA', () => {
        expect(canAmendData(user('bcba'))).toBe(true)
    })

    it('allows a coordinator', () => {
        // The tier the clinical team asked for: editing without the rest.
        expect(canAmendData(user('coordinator'))).toBe(true)
    })

    it('allows an admin whatever their clinical role', () => {
        // Admin access is a separate flag from the clinical role. Reading the
        // role alone is what made these controls invisible before.
        expect(canAmendData(user('therapist', { is_admin: true }))).toBe(true)
        expect(canAmendData(user('rbt', { is_superadmin: true }))).toBe(true)
    })

    it('refuses an RBT, a therapist and support staff', () => {
        expect(canAmendData(user('rbt'))).toBe(false)
        expect(canAmendData(user('therapist'))).toBe(false)
        expect(canAmendData(user('staff'))).toBe(false)
    })

    it('refuses a missing or empty user', () => {
        expect(canAmendData(null)).toBe(false)
        expect(canAmendData({})).toBe(false)
    })
})

describe('canSuperviseData', () => {
    it('allows a BCBA', () => {
        expect(canSuperviseData(user('bcba'))).toBe(true)
    })

    it('refuses a coordinator', () => {
        // Removing data and declaring a phase change stay with supervision.
        expect(canSuperviseData(user('coordinator'))).toBe(false)
    })

    it('allows an admin whatever their clinical role', () => {
        expect(canSuperviseData(user('therapist', { is_admin: true }))).toBe(true)
    })

    it('refuses an RBT and support staff', () => {
        expect(canSuperviseData(user('rbt'))).toBe(false)
        expect(canSuperviseData(user('staff'))).toBe(false)
    })
})

describe('role matching', () => {
    it('ignores capitalisation, since older accounts were created capitalised', () => {
        expect(canSuperviseData(user('BCBA'))).toBe(true)
        expect(canAmendData(user('Coordinator'))).toBe(true)
    })

    it('ignores surrounding whitespace', () => {
        expect(canSuperviseData(user('  bcba  '))).toBe(true)
    })

    it('does not match a role that merely contains a permitted one', () => {
        expect(canSuperviseData(user('not-bcba'))).toBe(false)
        expect(canAmendData(user('bcba-assistant'))).toBe(false)
    })
})
