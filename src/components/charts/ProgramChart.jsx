import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { responsesPerHour, formatRate } from '../../utils/rate'
import { countAxisDomain, PERCENT_DOMAIN } from '../../utils/chartAxis'
import { phaseSeries } from '../../utils/phaseSeries'

/**
 * The progress chart for a single program.
 *
 * Lifted out of ProgressPage so the same chart can be shown on the per-program
 * page and on the all-graphs-for-one-learner page. Two copies would drift
 * apart, and these charts are exported and attached to insurance submissions,
 * so they have to look identical wherever they are drawn.
 *
 * Gradient fills are referenced by id inside the SVG. Those ids used to be
 * fixed strings, which is fine for one chart on a page but collides once
 * several are drawn together: every chart would pick up the first definition.
 * They are namespaced per program below.
 */

// Phase-change ReferenceLine label rendered VERTICALLY along the marker line.
// The label (date + target transition) used to be horizontal and ran off the
// right edge of the chart on longer transitions, confusing staff. Drawing it
// rotated 90 degrees so it reads top-to-bottom next to the line keeps it
// on-chart and legible (per Dr. Joe's request, 2026-07).
export const phaseChangeLabel = (value) => ({ viewBox } = {}) => {
    if (!viewBox) return null
    const x = viewBox.x
    const y = viewBox.y + 6
    return (
        <text
            x={x}
            y={y}
            transform={`rotate(90, ${x}, ${y})`}
            textAnchor="start"
            dy={-4}
            fill="#0E8C6B"
            fontSize={11}
            fontWeight={700}
        >
            {value}
        </text>
    )
}

// Truncate long target names so labels don't overflow the chart edge.
export const truncate = (name, max = 18) => {
    if (!name) return ''
    return name.length > max ? name.slice(0, max - 1) + '…' : name
}

/**
 * Turn an analytics response into chart rows.
 *
 * Dates are parsed at noon so a timezone offset can never shift a session onto
 * the previous or next day.
 */
export function buildChartData(analytics) {
    return analytics?.sessions?.map(session => ({
        date: format(parseISO(session.date + 'T12:00:00'), 'MMM d'),
        // Kept alongside the display label so phase lines can be positioned by
        // real date rather than by matching formatted text.
        rawDate: session.date,
        accuracy: session.accuracy || 0,
        frequency: session.frequency_count || 0,
        duration: Math.round((session.total_duration_seconds || 0) / 60),
        interval: session.interval_percentage ?? null,
        latency: session.latency_average_seconds ?? null,
        // Whole-day session time, already combined across every therapist who
        // worked with the learner that day.
        sessionMinutes: session.session_minutes ?? null,
        rate: responsesPerHour(session.frequency_count, session.session_minutes),
        // Typed in for a past session rather than collected. Drawn differently
        // below so a reader can tell measured data from an entered figure.
        isSummary: !!session.is_summary,
    })) || []
}

/**
 * Point marker that distinguishes an entered figure from a measured one.
 *
 * A typed percentage has no trials behind it, so it is drawn hollow. Filling
 * it identically would let a graph imply precision that was never recorded.
 */
export const dataPointDot = (color) => (props) => {
    const { cx, cy, payload, key } = props
    if (cx == null || cy == null) return null
    return payload?.isSummary
        ? <circle key={key} cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke={color} strokeWidth={2} strokeDasharray="2 1.5" />
        : <circle key={key} cx={cx} cy={cy} r={4} fill={color} />
}

/** Phase change markers, labelled with the date so the X axis need not be read. */
export function buildPhaseChanges(analytics) {
    return (analytics?.phase_changes || []).map(pc => {
        const dateLabel = format(parseISO(pc.date + 'T12:00:00'), 'MMM d')
        const transition = pc.to_target
            ? `${truncate(pc.from_target)} → ${truncate(pc.to_target)}`
            : `${truncate(pc.from_target)} mastered`
        return { ...pc, dateLabel, chartLabel: `✓ ${dateLabel} · ${transition}` }
    })
}

/**
 * Position clinician-placed phase lines onto the chart's date categories.
 *
 * The X axis is categorical: a line can only be drawn on a date that has a
 * session. A phase change rarely falls exactly on one, so each line is snapped
 * to the first session on or after the date the clinician chose. That is also
 * the clinically correct place for it, since the new phase begins at that
 * session. A line dated after every session sits on the last one.
 *
 * Lines are dropped entirely when there is nothing to plot them against.
 */
export function resolvePhaseLines(phaseLines, chartData) {
    if (!phaseLines?.length || !chartData?.length) return []

    return phaseLines.map(line => {
        const at = chartData.find(row => row.rawDate >= line.date) || chartData[chartData.length - 1]
        return { id: line.id, title: line.title, notes: line.notes, dateLabel: at.date }
    })
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}

const AXIS = { stroke: '#9CA3AF', fontSize: 12, tickLine: false, axisLine: false }
const MARGIN = { top: 36, right: 80, left: 0, bottom: 0 }

export default function ProgramChart({
    program,
    analytics,
    frequencyMode = 'count',
    showMasteryLines = false,
    emptyAction = null,
}) {
    const chartData = buildChartData(analytics)
    const phaseChanges = buildPhaseChanges(analytics)
    const clinicianLines = resolvePhaseLines(analytics?.phase_lines, chartData)
    const targets = analytics?.targets || []

    const hasInterval = chartData.some(d => d.interval != null)
    const hasLatency = chartData.some(d => d.latency != null)

    // Namespaced so several charts on one page keep their own fills.
    const gid = (name) => `${name}-${program?.id ?? 'x'}`

    // Clinician-placed phase changes. Drawn the way ABA graphs are drawn and
    // the way the clinical team's own example showed: a solid vertical rule
    // with the phase named horizontally above it, rather than the rotated
    // label used for the mastery-derived markers.
    const clinicianPhaseLines = () => clinicianLines.map((line) => (
        <ReferenceLine
            key={`pl-${line.id}`}
            x={line.dateLabel}
            stroke="#334155"
            strokeWidth={1.5}
            ifOverflow="extendDomain"
            label={{
                value: line.title,
                position: 'top',
                fontSize: 11,
                fontWeight: 700,
                fill: '#334155',
            }}
        />
    ))

    // Single-subject design convention: a data path is never drawn across a
    // phase change line. Joining the points would imply the two conditions form
    // one continuous series, which is the opposite of what the line says.
    // Split on the lines a clinician placed, not on the mastery-derived markers,
    // which record a target transition rather than a change of condition.
    const seriesFor = (dataKey) => phaseSeries(chartData, clinicianLines, dataKey)

    const phaseLines = (strokeWidth = 2, extend = false) => phaseChanges.map((pc, idx) => (
        <ReferenceLine
            key={`pc-${idx}`}
            x={pc.dateLabel}
            stroke="#10B981"
            strokeDasharray="6 3"
            strokeWidth={strokeWidth}
            {...(extend ? { ifOverflow: 'extendDomain' } : {})}
            label={phaseChangeLabel(pc.chartLabel)}
        />
    ))

    // Mastery criteria, drawn as a horizontal rule across the chart at each
    // target's threshold. Off by default: Dena reported them as unexplained
    // orange lines that read like phase markers and asked for them gone
    // (20 Aug 2026). Kept behind a toggle rather than deleted, because a
    // threshold that silently disappears is worse than one that confuses, and
    // other supervisors do read them off the graph.
    const targetLines = (position = 'insideTopLeft') => (!showMasteryLines ? [] : targets.map((target) => (
        <ReferenceLine
            key={target.id}
            y={target.mastery_threshold}
            stroke={target.status === 'mastered' ? '#10B981' : '#F59E0B'}
            strokeDasharray={target.status === 'mastered' ? '4 4' : '8 4'}
            strokeWidth={2}
            label={{
                value: `${truncate(target.name)} (${target.mastery_threshold}%)`,
                position,
                fontSize: 11,
                fill: target.status === 'mastered' ? '#10B981' : '#F59E0B',
                fontWeight: 600,
            }}
        />
    )))

    if (chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#E0F4F7] flex items-center justify-center mb-4">
                    <TrendingUp size={36} className="text-[#159DB3]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-gray-800 mb-2">No Session Data Yet</h3>
                <p className="text-gray-500 mb-4 max-w-md text-center">
                    Start collecting data for this program to see progress over time.
                </p>
                {emptyAction}
            </div>
        )
    }

    // Interval recording: % present over time (0-100% axis, like accuracy)
    if (hasInterval) {
        const intervalSeries = seriesFor('interval')
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={intervalSeries.rows} margin={MARGIN}>
                    <defs>
                        <linearGradient id={gid('colorInterval')} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" {...AXIS} />
                    <YAxis domain={PERCENT_DOMAIN} {...AXIS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}%`, '% Interval']} />
                    {targetLines()}
                    {phaseLines()}
                    {clinicianPhaseLines()}
                    {intervalSeries.keys.map((key) => (
                        <Area key={key} type="monotone" dataKey={key} stroke="#159DB3" strokeWidth={3}
                            fill={`url(#${gid('colorInterval')})`} dot={{ fill: '#159DB3', r: 4 }}
                            activeDot={{ r: 6 }} connectNulls />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    // Latency: seconds to onset
    if (hasLatency) {
        const latencySeries = seriesFor('latency')
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencySeries.rows} margin={MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" {...AXIS} />
                    <YAxis domain={countAxisDomain(chartData.map(d => d.latency))} {...AXIS} tickFormatter={(v) => `${v}s`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}s`, 'Avg latency']} />
                    {phaseLines()}
                    {clinicianPhaseLines()}
                    {latencySeries.keys.map((key) => (
                        <Line key={key} type="monotone" dataKey={key} stroke="#8B5CF6" strokeWidth={3}
                            dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        )
    }

    // Frequency: raw count, or responses per hour
    if (program?.data_type === 'frequency') {
        const showingRate = frequencyMode === 'rate'
        const freqSeries = seriesFor(showingRate ? 'rate' : 'frequency')
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={freqSeries.rows} margin={MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" {...AXIS} />
                    <YAxis
                        domain={countAxisDomain(chartData.map(d => showingRate ? d.rate : d.frequency))}
                        {...AXIS}
                        tickFormatter={showingRate ? (v) => `${v}/hr` : undefined}
                    />
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name, entry) => (
                            showingRate
                                ? [formatRate(value), `Rate over ${entry?.payload?.sessionMinutes ?? 0} min`]
                                : [value, 'Count']
                        )}
                    />
                    {phaseLines(2.5, true)}
                    {clinicianPhaseLines()}
                    {freqSeries.keys.map((key) => (
                        <Line key={key} type="monotone" dataKey={key}
                            stroke="#159DB3" strokeWidth={3} dot={{ fill: '#159DB3', r: 4 }}
                            activeDot={{ r: 6 }} connectNulls={false} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        )
    }

    // Duration: minutes per day
    if (program?.data_type === 'duration') {
        const durationSeries = seriesFor('duration')
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={durationSeries.rows} margin={MARGIN}>
                    <defs>
                        <linearGradient id={gid('colorDuration')} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" {...AXIS} />
                    <YAxis domain={countAxisDomain(chartData.map(d => d.duration))} {...AXIS} tickFormatter={(v) => `${v}m`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value} min`, 'Duration']} />
                    {phaseLines(2.5, true)}
                    {clinicianPhaseLines()}
                    {durationSeries.keys.map((key) => (
                        <Area key={key} type="monotone" dataKey={key} stroke="#8B5CF6" strokeWidth={3}
                            fill={`url(#${gid('colorDuration')})`} dot={{ fill: '#8B5CF6', r: 4 }} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    // Task analysis: % of steps completed independently
    if (program?.data_type === 'task_analysis') {
        const taSeries = seriesFor('accuracy')
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taSeries.rows} margin={MARGIN}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" {...AXIS} />
                    <YAxis domain={PERCENT_DOMAIN} {...AXIS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name, entry) => [
                            `${value}%`,
                            entry?.payload?.isSummary ? 'Independent Steps (entered)' : 'Independent Steps',
                        ]}
                    />
                    {targetLines('right')}
                    {phaseLines()}
                    {clinicianPhaseLines()}
                    {taSeries.keys.map((key) => (
                        <Line key={key} type="monotone" dataKey={key} stroke="#10B981" strokeWidth={3}
                            dot={dataPointDot('#10B981')} activeDot={{ r: 6 }} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        )
    }

    // Default: trial-based accuracy
    const accuracySeries = seriesFor('accuracy')
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={accuracySeries.rows} margin={MARGIN}>
                <defs>
                    <linearGradient id={gid('colorAccuracy')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" {...AXIS} />
                <YAxis domain={PERCENT_DOMAIN} {...AXIS} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name, entry) => [
                        `${value}%`,
                        entry?.payload?.isSummary ? 'Accuracy (entered)' : 'Accuracy',
                    ]}
                />
                {targetLines()}
                {phaseLines()}
                    {clinicianPhaseLines()}
                {accuracySeries.keys.map((key) => (
                    <Area key={key} type="monotone" dataKey={key} stroke="#159DB3" strokeWidth={3}
                        fill={`url(#${gid('colorAccuracy')})`} dot={dataPointDot('#159DB3')}
                        activeDot={{ r: 6, fill: '#159DB3', stroke: '#fff', strokeWidth: 2 }} />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    )
}
