/**
 * What the signed-in user may do with recorded data.
 *
 * These mirror app/core/roles.py on the server. The server is the authority:
 * these only decide whether a control is worth showing. Every one of these
 * actions is checked again server side, so hiding a button is a courtesy, not
 * a security boundary.
 *
 * Keeping them in one place matters because the last version of this was
 * written inline on each page as `role === 'admin'`, which no clinical account
 * ever holds, so the controls were invisible to the BCBAs who needed them.
 *
 *   AMEND      correct a recorded value, or enter a percentage for a past
 *              session. BCBAs, coordinators and admins.
 *   SUPERVISE  remove data, clear a day, or declare a phase change. BCBAs and
 *              admins only.
 */

const roleOf = (user) => (user?.role || '').trim().toLowerCase()

const hasAdminFlag = (user) => !!(user?.is_admin || user?.is_superadmin)

/** Correct a recorded value, or enter historical data. */
export function canAmendData(user) {
    return hasAdminFlag(user) || ['bcba', 'coordinator'].includes(roleOf(user))
}

/** Remove data, clear a day, or place and rename phase change lines. */
export function canSuperviseData(user) {
    return hasAdminFlag(user) || roleOf(user) === 'bcba'
}
