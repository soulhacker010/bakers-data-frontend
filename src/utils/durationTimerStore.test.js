/**
 * Tests for the localStorage persistence layer for duration timers.
 *
 * Persistence is what makes a running timer survive a close / refresh /
 * crash. It must be namespaced per session (so a stale timer can never bleed
 * into a different session) and must fail soft (a storage problem should
 * never crash the live session page).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    saveTimers,
    loadTimers,
    clearTimers,
    storageKey,
} from './durationTimerStore'

const sessionA = 'sess-A'
const sessionB = 'sess-B'

const sampleMap = () =>
    new Map([
        [11, { startedAt: 1000, lastTickAt: 2000, accumulatedMs: 0, adjustmentMs: 0, isRunning: true }],
        [22, { startedAt: null, lastTickAt: null, accumulatedMs: 30000, adjustmentMs: 5000, isRunning: false }],
    ])

// The shared test setup replaces localStorage with no-op stubs that don't
// persist. Persistence is the whole point of this module, so install a
// faithful in-memory Storage (same semantics as the browser's localStorage).
beforeEach(() => {
    const store = new Map()
    global.localStorage = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { store.set(k, String(v)) },
        removeItem: (k) => { store.delete(k) },
        clear: () => { store.clear() },
    }
})

describe('storageKey', () => {
    it('namespaces the key by session id', () => {
        expect(storageKey(sessionA)).not.toBe(storageKey(sessionB))
        expect(storageKey(sessionA)).toContain('sess-A')
    })
})

describe('save / load round-trip', () => {
    it('restores the exact same timer map', () => {
        saveTimers(sessionA, sampleMap())
        const loaded = loadTimers(sessionA)
        expect(loaded).toBeInstanceOf(Map)
        expect(loaded.get(11)).toEqual(sampleMap().get(11))
        expect(loaded.get(22)).toEqual(sampleMap().get(22))
    })

    it('preserves numeric program-id keys (not stringified)', () => {
        saveTimers(sessionA, sampleMap())
        const loaded = loadTimers(sessionA)
        expect(loaded.has(11)).toBe(true)
        expect(loaded.has('11')).toBe(false)
    })
})

describe('session namespacing', () => {
    it('does not load one session\'s timers under another session', () => {
        saveTimers(sessionA, sampleMap())
        expect(loadTimers(sessionB).size).toBe(0)
    })
})

describe('resilience', () => {
    it('returns an empty map when nothing is saved', () => {
        expect(loadTimers(sessionA)).toBeInstanceOf(Map)
        expect(loadTimers(sessionA).size).toBe(0)
    })

    it('returns an empty map (no throw) when the stored JSON is malformed', () => {
        localStorage.setItem(storageKey(sessionA), '{not valid json')
        expect(() => loadTimers(sessionA)).not.toThrow()
        expect(loadTimers(sessionA).size).toBe(0)
    })

    it('does not throw if localStorage.setItem fails (e.g. quota / disabled)', () => {
        const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceeded')
        })
        expect(() => saveTimers(sessionA, sampleMap())).not.toThrow()
        spy.mockRestore()
    })
})

describe('clear', () => {
    it('removes a session\'s saved timers', () => {
        saveTimers(sessionA, sampleMap())
        clearTimers(sessionA)
        expect(loadTimers(sessionA).size).toBe(0)
    })
})
