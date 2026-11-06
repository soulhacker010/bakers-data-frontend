/**
 * Whether a failed token refresh means the session is actually over.
 *
 * Dena (BCBA, Cor Behavioral), 6 Nov 2026:
 *   "Over the course of the day, therapist have been logged out more often and
 *    needing to sign back in multiple times throughout their sessions."
 *
 * When a request came back 401 the app refreshed the token once, and treated
 * every possible failure of that refresh as proof the session was over. A ten
 * second timeout, a dropped connection, or the hosting waking a cold service
 * all ended the session exactly as a rejected token did.
 *
 * Only the server saying the credentials are no good is evidence of that.
 * Anything else means we could not ask, which is a different answer, and
 * throwing a therapist out mid-session costs them the run they were scoring
 * and the trust that the app will still be there in ten minutes.
 *
 * Erring towards keeping the session is safe: every request is authorised on
 * the server anyway, so a session kept open past its time buys nothing except
 * one more 401, while a session ended wrongly costs real clinical work.
 */
export function shouldEndSession(error) {
    const status = error?.response?.status
    // Only a verdict on the credentials themselves ends it.
    return status === 401 || status === 403
}
