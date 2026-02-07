/**
 * useIdleTimeout Hook - HIPAA Compliant Session Timeout
 * 
 * Automatically logs out users after a period of inactivity.
 * This is required for HIPAA compliance to protect PHI.
 */
import { useEffect, useRef, useCallback } from 'react'
const isDev = import.meta.env.DEV

/**
 * Track user activity and trigger callback after idle timeout.
 * 
 * @param {Function} onIdle - Callback when user becomes idle
 * @param {number|null} idleTime - Timeout in milliseconds (null to disable)
 */
export function useIdleTimeout(onIdle, idleTime = 15 * 60 * 1000) {
    const timeoutRef = useRef(null)
    const onIdleRef = useRef(onIdle)
    const isEnabledRef = useRef(false)

    // Keep callback ref updated
    useEffect(() => {
        onIdleRef.current = onIdle
    }, [onIdle])

    // Track when idle timeout is enabled
    useEffect(() => {
        if (idleTime) {
            // Small delay to prevent triggering during login transition
            const enableTimer = setTimeout(() => {
                isEnabledRef.current = true
            }, 1000)
            return () => clearTimeout(enableTimer)
        } else {
            isEnabledRef.current = false
        }
    }, [idleTime])

    // Reset timeout on activity
    const resetTimeout = useCallback(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Only set timeout if enabled and idleTime is provided
        if (idleTime && isEnabledRef.current) {
            timeoutRef.current = setTimeout(() => {
                if (isEnabledRef.current) {
                    if (isDev) {
                        console.log('Idle timeout triggered after', idleTime / 1000 / 60, 'minutes')
                    }
                    onIdleRef.current?.()
                }
            }, idleTime)
        }
    }, [idleTime])

    useEffect(() => {
        // Don't set up listeners if timeout is disabled
        if (!idleTime) {
            return
        }

        // Events that indicate user activity
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ]

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, resetTimeout, { passive: true })
        })

        // Start initial timeout after a delay (to let login complete)
        const startTimer = setTimeout(() => {
            resetTimeout()
        }, 2000)

        // Cleanup
        return () => {
            clearTimeout(startTimer)
            events.forEach(event => {
                document.removeEventListener(event, resetTimeout)
            })
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [resetTimeout, idleTime])

    return { resetTimeout }
}

export default useIdleTimeout
