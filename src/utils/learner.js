/**
 * Identifying the learner on a graph.
 *
 * Dena (BCBA, Cor Behavioral), 20 Aug 2026:
 *   "can we add full name and date of birth to each graphing individually"
 *
 * Graphs leave the building. They are attached to insurance submissions and
 * filed in a learner's record, and an exported chart carried the program name
 * and nothing identifying the child it described. Two charts for two learners
 * on the same program were indistinguishable once printed.
 */

import { format } from 'date-fns'

/** "Jordan Miller", from whichever parts of the name are recorded. */
export function learnerName(client) {
    return [client?.first_name, client?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
}

/**
 * A date of birth as "Mar 14, 2018".
 *
 * Parsed from its parts rather than handed to `new Date`. A plain YYYY-MM-DD
 * string is read as UTC midnight, which in Eastern is the previous evening, and
 * a birth date reported a day early on a clinical document is not a cosmetic
 * problem.
 */
export function formatDateOfBirth(value) {
    if (!value || typeof value !== 'string') return ''

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
    if (!match) return ''

    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (Number.isNaN(date.getTime())) return ''

    return format(date, 'MMM d, yyyy')
}

/** "Jordan Miller · DOB Mar 14, 2018", or just the name when no DOB is held. */
export function learnerCaption(client) {
    const name = learnerName(client)
    const dob = formatDateOfBirth(client?.date_of_birth)

    if (!name) return ''
    return dob ? `${name} · DOB ${dob}` : name
}
