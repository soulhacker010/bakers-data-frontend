/**
 * Choosing the vertical scale on a progress chart.
 *
 * Dena (BCBA, Cor Behavioral), 20 Aug 2026:
 *   "review Y axis to be either 0-10 or 0-100"
 *
 * Count, duration and latency charts were left to scale themselves. Recharts
 * fits the axis to the data, so a program sitting between four and seven
 * responses drew an axis from 4 to 7 with ticks at 1.75 intervals. Two things
 * are wrong with that. Fractional responses do not exist, and an axis that does
 * not start at zero exaggerates every small movement — on charts that are read
 * as clinical evidence and signed off.
 *
 * Single-subject design convention is a zero baseline, so that is what these
 * return.
 */

/**
 * Percentage charts run the full scale, always.
 *
 * Accuracy and interval charts already did this. Task analysis did not, so a
 * learner steady between 40 and 60 percent appeared to be swinging wildly.
 */
export const PERCENT_DOMAIN = [0, 100]

/**
 * A zero-based domain for count-like data: raw counts, hourly rates, minutes,
 * seconds.
 *
 * The top rounds up to something a person can read off the gridlines, with a
 * floor of ten so a program with two or three responses a day still gets a
 * usable axis instead of a flat line hard against the top.
 */
export function countAxisDomain(values) {
    const numbers = (Array.isArray(values) ? values : [])
        .filter((v) => typeof v === 'number' && Number.isFinite(v))

    const max = numbers.length ? Math.max(...numbers) : 0
    return [0, niceCeiling(max)]
}

/**
 * Round up to the next half-magnitude: multiples of 5 below a hundred, 50 below
 * a thousand, and so on. Keeps gridlines on numbers that divide evenly.
 */
function niceCeiling(max) {
    if (!(max > 10)) return 10

    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    const step = magnitude / 2

    return Math.ceil(max / step) * step
}
