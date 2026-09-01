/**
 * Turning a rejected request into something a clinician can act on.
 *
 * Dr Joe, 1 Sept 2026, on an RBT opening Staff Access:
 *   "why not just give a meaningful message instead of making it look like an
 *    error"
 *
 * He was right. The server had already said exactly what was wrong ("Staff
 * members cannot perform this action") and the screen threw that away and
 * showed "Failed to load staff members" in red, which reads like a fault in
 * the software rather than a rule working as intended. Staff then report it as
 * a bug, which costs everyone a round trip.
 *
 * The server is the authority on why it refused, so its sentence is the one
 * worth showing. The fallback is only for when it did not send one.
 */

/** The server's own explanation, if it sent a sentence rather than a payload. */
const serverDetail = (err) => {
    const detail = err?.response?.data?.detail
    // A 422 carries an array of field errors, not prose. Rendering it puts
    // "[object Object]" in front of a clinician.
    if (typeof detail !== 'string') return null
    const trimmed = detail.trim()
    return trimmed.length ? trimmed : null
}

/**
 * What to show the user for a failed request.
 *
 * @param {unknown} err       the rejected axios error
 * @param {string}  fallback  wording for when the server explained nothing
 */
export function apiErrorMessage(err, fallback) {
    return serverDetail(err) || fallback
}

/**
 * Whether the request was refused rather than broken.
 *
 * Worth separating because the two deserve different screens: a refusal is the
 * system working, and should read calmly, while a fault is worth an alarm.
 */
export function isPermissionError(err) {
    return err?.response?.status === 403
}
