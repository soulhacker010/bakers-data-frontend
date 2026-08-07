import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { getProgram } from '../services/programs'
import { getProgramProgress, exportProgramData } from '../services/analytics'
import { downloadChartPng } from '../utils/chartExport'
import { responsesPerMinute, formatRate } from '../utils/rate'
import { useToast } from '../context/ToastContext'
import { Download, Image as ImageIcon, TrendingUp, TrendingDown, Minus, ArrowLeft, Target, Clock, Hash, ListChecks } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, ReferenceLine } from 'recharts'
import { format, subDays, parseISO } from 'date-fns'
import { TargetsList } from '../components/targets'

const dateRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
]

// Phase-change ReferenceLine label rendered VERTICALLY along the marker line.
// The label (date + target transition) used to be horizontal and ran off the
// right edge of the chart on longer transitions, confusing staff. Drawing it
// rotated 90° so it reads top-to-bottom next to the line keeps it on-chart
// and legible (per Dr. Joe's request, 2026-07).
const phaseChangeLabel = (value) => ({ viewBox } = {}) => {
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

export default function ProgressPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [dateRange, setDateRange] = useState('30')
    const [targetFilter, setTargetFilter] = useState('all')  // 'all' or a target id
    // Frequency programs can be charted as a raw count or as responses per
    // minute. Rate is the clinically comparable one, but count is what staff
    // recognise from the collection screen, so both are offered.
    const [frequencyMode, setFrequencyMode] = useState('count')  // 'count' | 'rate'
    const [program, setProgram] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const chartRef = useRef(null)

    // Fetch program and analytics data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const programData = await getProgram(id)
                setProgram(programData)

                // Calculate date range
                let dateFrom = null
                if (dateRange !== 'all') {
                    const days = parseInt(dateRange)
                    dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd')
                }

                const analyticsData = await getProgramProgress(id, {
                    dateFrom,
                    targetId: targetFilter === 'all' ? null : targetFilter,
                })
                setAnalytics(analyticsData)
            } catch (err) {
                console.error('Failed to load progress:', err)
                toast.error('Failed to load program progress')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, dateRange, targetFilter, toast])

    // Format chart data from analytics
    // Use parseISO with noon time to avoid timezone date shift
    const chartData = analytics?.sessions?.map(session => ({
        date: format(parseISO(session.date + 'T12:00:00'), 'MMM d'),
        accuracy: session.accuracy || 0,
        frequency: session.frequency_count || 0,
        // Session time for the whole day, already combined across every
        // therapist who worked with the learner. Null when nothing measurable
        // was recorded, which leaves a gap on the rate chart rather than a
        // misleading zero.
        sessionMinutes: session.session_minutes ?? null,
        rate: responsesPerMinute(session.frequency_count, session.session_minutes),
        duration: Math.round((session.total_duration_seconds || 0) / 60), // Convert to minutes
        interval: session.interval_percentage ?? null,        // % present (interval recording)
        latency: session.latency_average_seconds ?? null,     // avg seconds-to-onset (latency)
    })) || []

    // When a target with an interval/latency measurement method is selected, the
    // analytics rows carry these fields and we switch the chart accordingly.
    const hasInterval = chartData.some(d => d.interval != null)
    const hasLatency = chartData.some(d => d.latency != null)

    // Calculate stats from real data
    const totalSessions = analytics?.overall_stats?.total_sessions || 0
    const latestAccuracy = chartData.length > 0 ? chartData[chartData.length - 1]?.accuracy : 0
    const trend = analytics?.overall_stats?.trend || 'stable'

    // Extract targets for reference lines on graph
    const targets = analytics?.targets || []

    // Truncate long target names so labels don't overflow the chart edge.
    const truncate = (name, max = 18) => {
        if (!name) return ''
        return name.length > max ? name.slice(0, max - 1) + '…' : name
    }

    // Extract phase changes for vertical markers.
    // Build a label that includes the introduction date so therapists can
    // see WHEN each target transitioned without having to read the X-axis.
    const phaseChanges = (analytics?.phase_changes || []).map(pc => {
        const dateLabel = format(parseISO(pc.date + 'T12:00:00'), 'MMM d')
        const transition = pc.to_target
            ? `${truncate(pc.from_target)} → ${truncate(pc.to_target)}`
            : `${truncate(pc.from_target)} mastered`
        return {
            ...pc,
            dateLabel,
            chartLabel: `✓ ${dateLabel} · ${transition}`,
        }
    })

    const handleExport = async () => {
        try {
            await exportProgramData(id, program?.name)
            toast.success('Export downloaded!')
        } catch (err) {
            toast.error(err.message || 'Export failed')
        }
    }

    // Download the on-screen chart as a PNG (with a header) — the artifact
    // clinics actually attach to insurance submissions.
    const handleDownloadGraph = async () => {
        try {
            const svg = chartRef.current?.querySelector('svg')
            const rangeLabel = dateRangeOptions.find(o => o.value === dateRange)?.label || ''
            await downloadChartPng(svg, {
                title: program?.name || 'Program',
                subtitle: `${chartInfo.title} · ${rangeLabel} · exported ${format(new Date(), 'MMM d, yyyy')}`,
            })
            toast.success('Graph downloaded!')
        } catch (err) {
            toast.error(err.message || 'Could not download the graph')
        }
    }

    // Get chart title and info based on data type
    const getChartInfo = () => {
        if (hasInterval) return { title: '% Interval Over Time', yLabel: '% Interval', unit: '%' }
        if (hasLatency) return { title: 'Latency Over Time', yLabel: 'Seconds', unit: 's' }
        switch (program?.data_type) {
            case 'frequency':
                return frequencyMode === 'rate'
                    ? { title: 'Rate Over Time', yLabel: 'Responses per minute', unit: '/min' }
                    : { title: 'Frequency Over Time', yLabel: 'Count', unit: '' }
            case 'duration':
                return { title: 'Duration Over Time', yLabel: 'Minutes', unit: ' min' }
            case 'task_analysis':
                return { title: 'Task Completion Over Time', yLabel: 'Steps Completed', unit: '' }
            default:
                return { title: 'Progress Over Time', yLabel: 'Accuracy', unit: '%' }
        }
    }

    const chartInfo = getChartInfo()

    // Render chart based on program data type
    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[#E0F4F7] flex items-center justify-center mb-4">
                        <TrendingUp size={36} className="text-[#159DB3]" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-gray-800 mb-2">No Session Data Yet</h3>
                    <p className="text-gray-500 mb-4 max-w-md text-center">
                        Start collecting data for this program to see your progress over time.
                    </p>
                    <button
                        onClick={() => navigate('/sessions/new')}
                        className="px-6 py-3 bg-gradient-to-r from-[#159DB3] to-[#214B9D] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                        Start a Session
                    </button>
                </div>
            )
        }

        // Interval recording: % present over time (0–100% axis, like accuracy)
        if (hasInterval) {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorInterval" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`${value}%`, '% Interval']}
                        />
                        {targets.map((target) => (
                            <ReferenceLine
                                key={target.id}
                                y={target.mastery_threshold}
                                stroke={target.status === 'mastered' ? '#10B981' : '#F59E0B'}
                                strokeDasharray={target.status === 'mastered' ? '4 4' : '8 4'}
                                strokeWidth={2}
                                label={{
                                    value: `${truncate(target.name)} (${target.mastery_threshold}%)`,
                                    position: 'insideTopLeft', fontSize: 11,
                                    fill: target.status === 'mastered' ? '#10B981' : '#F59E0B', fontWeight: 600,
                                }}
                            />
                        ))}
                        {phaseChanges.map((pc, idx) => (
                            <ReferenceLine key={`pc-${idx}`} x={pc.dateLabel} stroke="#10B981" strokeDasharray="6 3" strokeWidth={2}
                                label={phaseChangeLabel(pc.chartLabel)} />
                        ))}
                        <Area type="monotone" dataKey="interval" stroke="#159DB3" strokeWidth={3} fill="url(#colorInterval)" dot={{ fill: '#159DB3', r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    </AreaChart>
                </ResponsiveContainer>
            )
        }

        // Latency: Line chart in seconds
        if (hasLatency) {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}s`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`${value}s`, 'Avg latency']}
                        />
                        {phaseChanges.map((pc, idx) => (
                            <ReferenceLine key={`pc-${idx}`} x={pc.dateLabel} stroke="#10B981" strokeDasharray="6 3" strokeWidth={2}
                                label={phaseChangeLabel(pc.chartLabel)} />
                        ))}
                        <Line type="monotone" dataKey="latency" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            )
        }

        // Frequency: Line chart (changed from bar per client request), plotted
        // either as the raw count or as responses per minute.
        if (program?.data_type === 'frequency') {
            const showingRate = frequencyMode === 'rate'
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false}
                            tickFormatter={showingRate ? (v) => `${v}/min` : undefined}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value, name, entry) => (
                                showingRate
                                    ? [formatRate(value), `Rate over ${entry?.payload?.sessionMinutes ?? 0} min`]
                                    : [value, 'Count']
                            )}
                        />
                        {/* Phase change vertical lines — drawn at the date a target
                            was mastered, with a label showing the next target taking over.
                            Tall stroke + readable label so the transition is obvious on
                            the graph (per client request from Dena/ABA team). */}
                        {phaseChanges.map((pc, idx) => (
                            <ReferenceLine
                                key={`pc-${idx}`}
                                x={pc.dateLabel}
                                stroke="#10B981"
                                strokeDasharray="6 3"
                                strokeWidth={2.5}
                                ifOverflow="extendDomain"
                                label={phaseChangeLabel(pc.chartLabel)}
                            />
                        ))}
                        <Line
                            type="monotone"
                            dataKey={showingRate ? 'rate' : 'frequency'}
                            stroke="#159DB3" strokeWidth={3}
                            dot={{ fill: '#159DB3', r: 4 }} activeDot={{ r: 6 }}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )
        }

        // Duration: Line chart with minutes
        if (program?.data_type === 'duration') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                            }}
                            formatter={(value) => [`${value} min`, 'Duration']}
                        />
                        {/* Phase change vertical lines — drawn at the date a target
                            was mastered, with a label showing the next target taking over.
                            Tall stroke + readable label so the transition is obvious on
                            the graph (per client request from Dena/ABA team). */}
                        {phaseChanges.map((pc, idx) => (
                            <ReferenceLine
                                key={`pc-${idx}`}
                                x={pc.dateLabel}
                                stroke="#10B981"
                                strokeDasharray="6 3"
                                strokeWidth={2.5}
                                ifOverflow="extendDomain"
                                label={phaseChangeLabel(pc.chartLabel)}
                            />
                        ))}
                        <Area type="monotone" dataKey="duration" stroke="#8B5CF6" strokeWidth={3} fill="url(#colorDuration)" dot={{ fill: '#8B5CF6', r: 4 }} />
                    </AreaChart>
                </ResponsiveContainer>
            )
        }

        // Task Analysis: Line chart (changed from bar per client request)
        if (program?.data_type === 'task_analysis') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                            }}
                            formatter={(value) => [`${value}%`, 'Independent Steps']}
                        />
                        {/* Target threshold reference lines */}
                        {targets.map((target) => (
                            <ReferenceLine
                                key={target.id}
                                y={target.mastery_threshold}
                                stroke={target.status === 'mastered' ? '#10B981' : '#F59E0B'}
                                strokeDasharray={target.status === 'mastered' ? '4 4' : '8 4'}
                                strokeWidth={2}
                                label={{
                                    value: `${target.name} (${target.mastery_threshold}%)`,
                                    position: 'right',
                                    fontSize: 11,
                                    fill: target.status === 'mastered' ? '#10B981' : '#F59E0B',
                                    fontWeight: 600,
                                }}
                            />
                        ))}
                        <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            )
        }

        // Default: Trial-based accuracy chart
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 36, right: 80, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    {/* Target threshold reference lines */}
                    {targets.map((target) => (
                        <ReferenceLine
                            key={target.id}
                            y={target.mastery_threshold}
                            stroke={target.status === 'mastered' ? '#10B981' : '#F59E0B'}
                            strokeDasharray={target.status === 'mastered' ? '4 4' : '8 4'}
                            strokeWidth={2}
                            label={{
                                value: `${truncate(target.name)} (${target.mastery_threshold}%)`,
                                position: 'insideTopLeft',
                                fontSize: 11,
                                fill: target.status === 'mastered' ? '#10B981' : '#F59E0B',
                                fontWeight: 600,
                            }}
                        />
                    ))}
                    {/* Phase change vertical lines */}
                    {phaseChanges.map((pc, idx) => (
                        <ReferenceLine
                            key={`pc-${idx}`}
                            x={pc.dateLabel}
                            stroke="#10B981"
                            strokeDasharray="6 3"
                            strokeWidth={2}
                            label={phaseChangeLabel(pc.chartLabel)}
                        />
                    ))}
                    <Area type="monotone" dataKey="accuracy" stroke="#159DB3" strokeWidth={3} fill="url(#colorAccuracy)" dot={{ fill: '#159DB3', r: 4 }} activeDot={{ r: 6, fill: '#159DB3', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    // Get appropriate stats based on data type
    const renderStats = () => {
        const totalFrequency = chartData.reduce((sum, d) => sum + (d.frequency || 0), 0)
        const totalDuration = chartData.reduce((sum, d) => sum + (d.duration || 0), 0)
        const avgDuration = chartData.length > 0 ? Math.round(totalDuration / chartData.length) : 0

        if (hasInterval) {
            const vals = chartData.filter(d => d.interval != null).map(d => d.interval)
            const avgInterval = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
            const latestInterval = vals.length ? vals[vals.length - 1] : 0
            return (
                <>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-primary">{latestInterval}%</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Latest % Interval</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-orange-500">{avgInterval}%</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Avg % Interval</p>
                    </div>
                </>
            )
        }

        if (hasLatency) {
            const vals = chartData.filter(d => d.latency != null).map(d => d.latency)
            const avgLatency = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
            const latestLatency = vals.length ? vals[vals.length - 1] : 0
            return (
                <>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-purple-600">{latestLatency}s</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Latest Latency</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="font-heading text-3xl font-bold text-purple-500">{avgLatency}s</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Avg Latency</p>
                    </div>
                </>
            )
        }

        switch (program?.data_type) {
            case 'frequency':
                return (
                    <>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-primary">{totalFrequency}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Count</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-orange-500">
                                {chartData.length > 0 ? Math.round(totalFrequency / chartData.length) : 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Avg per Session</p>
                        </div>
                    </>
                )
            case 'duration':
                return (
                    <>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-purple-600">{totalDuration} min</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Duration</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-purple-500">{avgDuration} min</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Avg Duration</p>
                        </div>
                    </>
                )
            case 'task_analysis':
                return (
                    <>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-green-600">{latestAccuracy}%</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Latest Independence</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                        </div>
                        <div className={`text-center p-4 bg-gray-50 rounded-xl`}>
                            <p className={`font-heading text-2xl font-bold flex items-center justify-center gap-2 ${trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                {trend === 'improving' && <><TrendingUp size={24} /> Improving</>}
                                {trend === 'declining' && <><TrendingDown size={24} /> Declining</>}
                                {trend === 'stable' && <><Minus size={24} /> Stable</>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Trend</p>
                        </div>
                    </>
                )
            default:
                return (
                    <>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-primary">{latestAccuracy}%</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Latest Accuracy</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                        </div>
                        <div className={`text-center p-4 bg-gray-50 rounded-xl`}>
                            <p className={`font-heading text-2xl font-bold flex items-center justify-center gap-2 ${trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                {trend === 'improving' && <><TrendingUp size={24} /> Improving</>}
                                {trend === 'declining' && <><TrendingDown size={24} /> Declining</>}
                                {trend === 'stable' && <><Minus size={24} /> Stable</>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Trend</p>
                        </div>
                    </>
                )
        }
    }

    // Show loading state
    if (loading || !program) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading program...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <Link
                        to={`/clients/${program.client_id}`}
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Client
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="label-uppercase-light mb-2">P R O G R E S S &nbsp; T R A C K I N G</p>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                {program.name}
                            </h1>
                            <p className="text-white/70">
                                Viewing progress over {dateRangeOptions.find(o => o.value === dateRange)?.label?.toLowerCase()}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleDownloadGraph}
                                className="btn-outline-premium bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                            >
                                <ImageIcon size={18} />
                                Download Graph
                            </button>
                            <button
                                onClick={handleExport}
                                className="btn-outline-premium bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                            >
                                <Download size={18} />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                <div className="flex flex-wrap items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-700 min-w-[180px] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                        {dateRangeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {/* Per-target filter — lets therapists drill into a single
                        target's history (including mastered ones) so they can
                        review the data behind a phase change. */}
                    {targets.length > 0 && (
                        <select
                            value={targetFilter}
                            onChange={(e) => setTargetFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-700 min-w-[200px] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            title="View data for a specific target"
                        >
                            <option value="all">All Targets</option>
                            {targets.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}{t.status === 'mastered' ? ' ✓ Mastered' : t.status === 'on-hold' ? ' · On Hold' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="px-6 pb-6 max-w-screen-xl mx-auto">
                <div className="card-premium p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h2 className="font-heading text-xl font-bold text-gray-900">{chartInfo.title}</h2>

                        {/* Count or rate. Rate divides the day's count by the time
                            observed, so sessions of different lengths compare
                            fairly (requested by the clinical team). */}
                        {program?.data_type === 'frequency' && (
                            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                {[['count', 'Count'], ['rate', 'Rate / min']].map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => setFrequencyMode(value)}
                                        aria-pressed={frequencyMode === value}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${frequencyMode === value
                                            ? 'bg-white text-[#159DB3] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* A day with no recorded session time cannot produce a rate,
                        so say so rather than letting the line quietly skip it. */}
                    {program?.data_type === 'frequency' && frequencyMode === 'rate' &&
                        chartData.some(d => d.rate == null) && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                                Some days have no recorded session time, so no rate can be shown for them.
                                Those points are left out of the line.
                            </p>
                        )}

                    <div className="h-80" ref={chartRef}>
                        {renderChart()}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-6 max-w-screen-xl mx-auto">
                <div className="card-premium p-6">
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Overall Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderStats()}
                    </div>
                </div>
            </div>

            {/* Targets Section */}
            <div className="px-6 pb-10 max-w-screen-xl mx-auto">
                <div className="card-premium p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[#E0F4F7] flex items-center justify-center">
                            <Target size={20} className="text-[#159DB3]" />
                        </div>
                        <div>
                            <h3 className="font-heading text-lg font-bold text-gray-900">Program Targets</h3>
                            <p className="text-sm text-gray-500">Track progress for each target</p>
                        </div>
                    </div>
                    <TargetsList programId={id} />
                </div>
            </div>
        </DashboardLayout>
    )
}
