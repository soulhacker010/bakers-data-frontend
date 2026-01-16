/**
 * Session Storage Utilities - Handle session recovery and state persistence
 * Protects against browser refresh, tab close, and provides session locking
 */

const SESSION_STORAGE_KEY = 'active_session';
const SESSION_LOCK_KEY = 'session_lock';

/**
 * Store the active session ID for recovery after refresh
 */
export const saveActiveSession = (sessionId, clientId) => {
    const sessionData = {
        sessionId,
        clientId,
        timestamp: Date.now(),
        tabId: getTabId()
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
};

/**
 * Get the stored active session (if any)
 */
export const getActiveSession = () => {
    try {
        const data = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!data) return null;

        const session = JSON.parse(data);

        // Check if session data is still valid (less than 24 hours old)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - session.timestamp > maxAge) {
            clearActiveSession();
            return null;
        }

        return session;
    } catch (e) {
        console.error('Error reading active session:', e);
        return null;
    }
};

/**
 * Clear the stored active session
 */
export const clearActiveSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_LOCK_KEY);
};

/**
 * Generate a unique tab ID for session locking
 */
const getTabId = () => {
    let tabId = sessionStorage.getItem('tab_id');
    if (!tabId) {
        tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        sessionStorage.setItem('tab_id', tabId);
    }
    return tabId;
};

/**
 * Check if another tab has an active session lock
 * Returns true if locked by another tab
 */
export const isSessionLockedByAnotherTab = () => {
    try {
        const lockData = localStorage.getItem(SESSION_LOCK_KEY);
        if (!lockData) return false;

        const lock = JSON.parse(lockData);
        const currentTabId = getTabId();

        // If same tab, not locked
        if (lock.tabId === currentTabId) return false;

        // If lock is older than 5 minutes, consider it stale
        const lockAge = Date.now() - lock.timestamp;
        if (lockAge > 5 * 60 * 1000) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Acquire session lock for this tab
 */
export const acquireSessionLock = (sessionId) => {
    const lockData = {
        sessionId,
        tabId: getTabId(),
        timestamp: Date.now()
    };
    localStorage.setItem(SESSION_LOCK_KEY, JSON.stringify(lockData));
};

/**
 * Release session lock (when ending session or closing tab)
 */
export const releaseSessionLock = () => {
    const lockData = localStorage.getItem(SESSION_LOCK_KEY);
    if (lockData) {
        try {
            const lock = JSON.parse(lockData);
            // Only release if this tab owns the lock
            if (lock.tabId === getTabId()) {
                localStorage.removeItem(SESSION_LOCK_KEY);
            }
        } catch (e) {
            localStorage.removeItem(SESSION_LOCK_KEY);
        }
    }
};

/**
 * Refresh the session lock timestamp (keep-alive)
 * Call this periodically to prevent lock from going stale
 */
export const refreshSessionLock = () => {
    const lockData = localStorage.getItem(SESSION_LOCK_KEY);
    if (lockData) {
        try {
            const lock = JSON.parse(lockData);
            if (lock.tabId === getTabId()) {
                lock.timestamp = Date.now();
                localStorage.setItem(SESSION_LOCK_KEY, JSON.stringify(lock));
            }
        } catch (e) {
            console.error('Error refreshing session lock:', e);
        }
    }
};

// Listen for tab close to release lock
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        releaseSessionLock();
    });
}
