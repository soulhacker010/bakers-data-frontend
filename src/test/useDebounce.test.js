/**
 * Tests for useDebounce hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounceSubmit, useLoading } from '../hooks/useDebounce'

describe('useDebounceSubmit', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    it('should call the async function when triggered', async () => {
        const mockFn = vi.fn().mockResolvedValue('success')

        const { result } = renderHook(() => useDebounceSubmit(mockFn))
        const [debouncedFn] = result.current

        await act(async () => {
            await debouncedFn()
        })

        expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should set isSubmitting to true during submission', async () => {
        const mockFn = vi.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 100))
        )

        const { result } = renderHook(() => useDebounceSubmit(mockFn))

        // Check initial state
        expect(result.current[1]).toBe(false) // isSubmitting

        // Start submission
        act(() => {
            result.current[0]()
        })

        // Should be submitting now
        expect(result.current[1]).toBe(true)
    })

    it('should debounce rapid successive calls', async () => {
        const mockFn = vi.fn().mockResolvedValue('success')

        const { result } = renderHook(() => useDebounceSubmit(mockFn, 500))
        const [debouncedFn] = result.current

        // Call rapidly (within debounce window)
        await act(async () => {
            debouncedFn()
        })

        // Second call should be debounced
        await act(async () => {
            debouncedFn()
        })

        // Only first call should have executed (second debounced)
        expect(mockFn).toHaveBeenCalledTimes(1)
    })
})

describe('useLoading', () => {
    it('should start with initial loading state', () => {
        const { result } = renderHook(() => useLoading(false))

        expect(result.current[0]).toBe(false)
    })

    it('should set loading to true during async operation', async () => {
        const { result } = renderHook(() => useLoading())
        const [loading, withLoading] = result.current

        expect(loading).toBe(false)

        const mockAsyncFn = vi.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 100))
        )

        act(() => {
            withLoading(mockAsyncFn)
        })

        // Should be loading now
        expect(result.current[0]).toBe(true)
    })
})
