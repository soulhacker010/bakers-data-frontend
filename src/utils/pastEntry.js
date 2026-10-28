/**
 * Entering a figure for a session that was missed at the time.
 *
 * Dena (BCBA, Cor Behavioral), 28 Oct 2026:
 *   "When we input previous data, it only allows us to input percentages, even
 *    on duration or rate graphs."
 *
 * The form was built for trial programs and asked for a percentage whatever the
 * program recorded. A frequency program counts occurrences and a duration
 * program counts seconds, and neither of those is a percentage, so a clinician
 * filling in a missed session on either had nothing truthful to type.
 *
 * Which figure a program takes is decided here rather than in the form, so the
 * label, the input bounds and the field it is sent under can never drift apart
 * from each other. The server checks the same rule against the program, since
 * it is the only side that knows for certain.
 */

const PERCENTAGE = {
    key: 'percentage',
    label: 'Percentage',
    unit: '%',
    placeholder: 'e.g. 80',
    step: '0.1',
    max: 100,
    help: 'The percentage this session scored',
}

const BY_TYPE = {
    frequency: {
        key: 'count',
        label: 'Occurrences',
        unit: '',
        placeholder: 'e.g. 12',
        step: '1',
        // Deliberately uncapped: a count has no natural ceiling, and capping it
        // at a hundred is how this came to ask everyone for a percentage.
        max: undefined,
        help: 'How many times the behavior occurred',
    },
    duration: {
        key: 'duration_seconds',
        label: 'Seconds',
        unit: 's',
        placeholder: 'e.g. 180',
        step: '1',
        max: undefined,
        help: 'Total time in seconds',
    },
}

/** What this program's past entry asks for. */
export function pastEntryField(dataType) {
    return BY_TYPE[dataType] || PERCENTAGE
}

/**
 * The request body for one past entry.
 *
 * Throws with a message meant for the clinician, because the only caller is a
 * form and every one of these is something they can correct themselves.
 */
export function pastEntryPayload({ clientId, programId, date, dataType, value, notes, targetId }) {
    const field = pastEntryField(dataType)
    const number = parseFloat(value)

    if (Number.isNaN(number)) {
        throw new Error(`Please enter ${field.label.toLowerCase()} for this session`)
    }
    if (number < 0) {
        throw new Error(`${field.label} cannot be negative`)
    }
    if (field.max != null && number > field.max) {
        throw new Error(`Please enter ${field.label.toLowerCase()} between 0 and ${field.max}`)
    }

    return {
        client_id: clientId,
        program_id: programId,
        date,
        // Half an occurrence is not a thing, and nor is half a second here.
        [field.key]: field.key === 'percentage' ? number : Math.round(number),
        target_id: targetId || null,
        notes: notes || null,
    }
}
