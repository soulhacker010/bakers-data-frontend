/**
 * Why a program has nothing to collect against.
 *
 * Dena (BCBA, Cor Behavioral), 3 Sept 2026:
 *   "none of the client targets are showing up"
 *
 * Data collection lists only targets whose status is 'active', so mastering a
 * target or putting it on hold removes it from the session screen. That is
 * correct and stays. What was wrong is that the screen said nothing: the list
 * simply emptied, which reads as the program being broken rather than as every
 * target having been met. Her targets were never lost, and the screen should
 * have been the thing that told her so.
 *
 * Returns null when there is nothing to explain, which includes a program that
 * carries no targets at all: frequency and duration programs are collected
 * against the program itself, and warning that clinician about missing targets
 * would be inventing a problem they do not have.
 */

/** The one status that can be collected against. */
const ACTIVE = 'active'

const MASTERED = 'mastered'
const ON_HOLD = 'on-hold'

export function unavailableTargetsNotice(targets) {
    const list = Array.isArray(targets) ? targets : []

    // Anything unrecognised counts as not collectable. The dangerous direction
    // is assuming an unfamiliar status is safe to collect against.
    if (!list.length || list.some((t) => t?.status === ACTIVE)) return null

    const statuses = new Set(list.map((t) => t?.status))
    const count = list.length
    const plural = count === 1 ? 'target' : 'targets'

    if (statuses.size === 1 && statuses.has(MASTERED)) {
        return {
            count,
            title: count === 1
                ? 'The target in this program has been mastered'
                : `All ${count} targets in this program have been mastered`,
            detail: `Nothing is hidden or lost. Mastered ${plural} leave data collection so the team is not `
                + 'still running them. A BCBA can set one back to active on the program page if you need to '
                + 'keep collecting.',
        }
    }

    if (statuses.size === 1 && statuses.has(ON_HOLD)) {
        return {
            count,
            title: count === 1
                ? 'The target in this program is on hold'
                : `All ${count} targets in this program are on hold`,
            detail: `Nothing is hidden or lost. A BCBA can take a ${plural === 'target' ? 'target' : 'target'} `
                + 'off hold on the program page when it is ready to run again.',
        }
    }

    return {
        count,
        title: 'No targets in this program are active',
        detail: `This program has ${count} ${plural}, none of them currently set to active. Nothing is hidden `
            + 'or lost. A BCBA can set one back to active on the program page.',
    }
}
