/**
 * The toast api object must be referentially stable. Pages list `toast` in
 * fetch-effect dependencies; if the provider recreates it on every render,
 * a failed fetch's error toast re-renders the provider, the new identity
 * re-fires the effect, and the page hammers the API in an infinite
 * fetch -> error toast -> refetch loop (observed live on ProgressPage).
 */
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

describe('ToastContext', () => {
    it('keeps the toast object identity stable across provider re-renders', () => {
        const identities = []
        let fireToast
        function Probe() {
            const { toast } = useToast()
            identities.push(toast)
            fireToast = () => toast.info('hello')
            return null
        }
        const { rerender } = render(
            <ToastProvider>
                <Probe />
            </ToastProvider>
        )

        act(() => {
            fireToast() // adds a toast -> provider state change -> re-render
        })
        rerender(
            <ToastProvider>
                <Probe />
            </ToastProvider>
        )

        expect(identities.length).toBeGreaterThan(1)
        const first = identities[0]
        for (const t of identities) {
            expect(t).toBe(first)
        }
    })
})
