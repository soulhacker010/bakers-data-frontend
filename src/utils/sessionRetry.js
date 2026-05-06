/**
 * Session Data Retry Queue
 * 
 * Buffers failed session data saves in localStorage and retries them.
 * This prevents data loss from network errors, rate limiting, or brief token issues.
 * 
 * Critical for production: therapists collecting behavioral data cannot lose data points.
 */

const RETRY_QUEUE_KEY = 'session_retry_queue'
const MAX_RETRIES = 5
const RETRY_DELAY_MS = 3000  // 3 seconds between retries
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000  // 24 hours

/**
 * Get pending items from the retry queue
 */
const getQueue = () => {
    try {
        const data = localStorage.getItem(RETRY_QUEUE_KEY)
        if (!data) return []
        const queue = JSON.parse(data)
        // Filter out items older than 24 hours
        const cutoff = Date.now() - MAX_QUEUE_AGE_MS
        return queue.filter(item => item.timestamp > cutoff)
    } catch {
        return []
    }
}

/**
 * Save queue to localStorage
 */
const saveQueue = (queue) => {
    try {
        localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue))
    } catch (e) {
        console.error('Failed to save retry queue:', e)
    }
}

/**
 * Add a failed data point to the retry queue
 */
export const enqueueDataPoint = (sessionId, dataPoint) => {
    const queue = getQueue()
    queue.push({
        sessionId,
        dataPoint,
        timestamp: Date.now(),
        retries: 0,
    })
    saveQueue(queue)
}

/**
 * Process the retry queue - attempt to save all pending data points.
 * Call this periodically and on session end.
 * 
 * @param {Function} recordFn - The recordSessionData function from sessions service
 * @returns {Object} - { succeeded: number, failed: number, remaining: number }
 */
export const processRetryQueue = async (recordFn) => {
    const queue = getQueue()
    if (queue.length === 0) return { succeeded: 0, failed: 0, remaining: 0 }

    let succeeded = 0
    let failed = 0
    const remaining = []

    for (const item of queue) {
        try {
            await recordFn(item.sessionId, item.dataPoint)
            succeeded++
        } catch (err) {
            item.retries++
            if (item.retries < MAX_RETRIES) {
                remaining.push(item)
            } else {
                failed++
                console.error(`Permanently failed to save data point after ${MAX_RETRIES} retries:`, item.dataPoint)
            }
        }
        // Small delay between retries to avoid hammering the server
        if (remaining.length > 0 || succeeded > 0) {
            await new Promise(r => setTimeout(r, 200))
        }
    }

    saveQueue(remaining)
    return { succeeded, failed, remaining: remaining.length }
}

/**
 * Get the count of pending items in the retry queue
 */
export const getRetryQueueCount = () => {
    return getQueue().length
}

/**
 * Clear the retry queue (e.g., on successful session end)
 */
export const clearRetryQueue = () => {
    localStorage.removeItem(RETRY_QUEUE_KEY)
}

/**
 * Record a data point with automatic retry on failure.
 * This is the main function to use instead of directly calling recordSessionData.
 * 
 * @param {Function} recordFn - The recordSessionData function
 * @param {number} sessionId - Session ID
 * @param {Object} dataPoint - Data to record
 * @returns {boolean} - true if saved immediately, false if queued for retry
 */
export const recordWithRetry = async (recordFn, sessionId, dataPoint) => {
    try {
        await recordFn(sessionId, dataPoint)
        return true
    } catch (err) {
        // Don't retry if session is ended - that's a permanent error
        if (err.message?.includes('ended session')) {
            throw err
        }
        // Queue for retry
        enqueueDataPoint(sessionId, dataPoint)
        return false
    }
}
