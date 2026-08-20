/**
 * Breaking a data path at a phase change.
 *
 * Dena (BCBA, Cor Behavioral), 20 Aug 2026:
 *   "if a phase change line is put in, automatically not connecting the dot
 *    over one phase to another"
 *
 * This is the single-subject design convention rather than a preference. A data
 * path is never drawn across a phase change line, because joining the points
 * implies the two conditions form one continuous series when the entire purpose
 * of the line is to say they do not. Phase lines were built in the August batch
 * without this, so the graphs were technically wrong by the standard the
 * practice is held to.
 *
 * Recharts plots a categorical X axis, so the break is made by splitting the
 * values across one key per phase. Each key is drawn as its own line, and a key
 * carries a value only on the days inside its own phase.
 */

/**
 * Split one data key into a series per phase.
 *
 * Returns the rows with per-phase keys added, and the list of keys to draw. With
 * no phase line placed, the original key is returned untouched so a chart
 * without phases is completely unaffected.
 *
 * A phase line sits on the first day of its new phase (see `resolvePhaseLines`),
 * so that day belongs to the phase the line opens, not the one it closes.
 */
export function phaseSeries(rows, phaseLines, dataKey) {
    const data = Array.isArray(rows) ? rows : []
    const lines = Array.isArray(phaseLines) ? phaseLines : []

    // Where each phase begins, as a row index. A line that does not land on a
    // plotted day cannot break anything, and index 0 opens no new phase because
    // there is nothing before it to separate from.
    const boundaries = [...new Set(
        lines
            .map((line) => data.findIndex((row) => row.date === line.dateLabel))
            .filter((index) => index > 0)
    )].sort((a, b) => a - b)

    if (!boundaries.length) {
        return { rows: data, keys: [dataKey] }
    }

    const segmentOf = (index) => boundaries.filter((b) => b <= index).length
    const keys = [...new Set(data.map((_, index) => segmentOf(index)))]
        .map((segment) => `${dataKey}__${segment}`)

    const out = data.map((row, index) => ({
        ...row,
        [`${dataKey}__${segmentOf(index)}`]: row[dataKey],
    }))

    return { rows: out, keys }
}
