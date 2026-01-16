/**
 * Custom hooks for preventing duplicate submissions and handling loading states
 */
import { useState, useCallback, useRef } from 'react';

/**
 * Hook for preventing double-click submissions
 * Wraps an async function and prevents multiple simultaneous calls
 * 
 * Usage:
 * const [handleSubmit, isSubmitting] = useDebounceSubmit(async () => {
 *   await api.post('/endpoint', data);
 * });
 * 
 * <button onClick={handleSubmit} disabled={isSubmitting}>
 *   {isSubmitting ? 'Saving...' : 'Save'}
 * </button>
 */
export const useDebounceSubmit = (asyncFunction, debounceMs = 500) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const lastCallTime = useRef(0);

    const debouncedFunction = useCallback(async (...args) => {
        const now = Date.now();

        // Prevent rapid successive calls
        if (now - lastCallTime.current < debounceMs) {
            console.log('Debounced: preventing duplicate submission');
            return;
        }

        // Prevent concurrent calls
        if (isSubmitting) {
            console.log('Already submitting, ignoring duplicate call');
            return;
        }

        lastCallTime.current = now;
        setIsSubmitting(true);

        try {
            const result = await asyncFunction(...args);
            return result;
        } finally {
            setIsSubmitting(false);
        }
    }, [asyncFunction, debounceMs, isSubmitting]);

    return [debouncedFunction, isSubmitting];
};

/**
 * Hook for tracking loading state of async operations
 * 
 * Usage:
 * const [loading, withLoading] = useLoading();
 * const handleClick = () => withLoading(async () => {
 *   await someAsyncOperation();
 * });
 */
export const useLoading = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);

    const withLoading = useCallback(async (asyncFn) => {
        if (loading) return; // Prevent concurrent calls

        setLoading(true);
        try {
            return await asyncFn();
        } finally {
            setLoading(false);
        }
    }, [loading]);

    return [loading, withLoading, setLoading];
};

/**
 * Hook for preventing rapid button clicks (simple debounce)
 * Returns a function that ignores calls made within the debounce window
 */
export const useDebounce = (fn, delay = 300) => {
    const timeoutRef = useRef(null);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            fn(...args);
        }, delay);
    }, [fn, delay]);
};
