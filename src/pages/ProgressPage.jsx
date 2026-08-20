import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { getProgram } from '../services/programs'
import { getProgramProgress, exportProgramData } from '../services/analytics'
import { downloadChartPng } from '../utils/chartExport'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { recordSummaryEntry } from '../services/sessions'
import { Download, Image as ImageIcon, TrendingUp, TrendingDown, Minus, ArrowLeft, Target, Clock, Hash, ListChecks, Plus } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { TargetsList } from '../components/targets'
import ProgramChart, { buildChartData } from '../components/charts/ProgramChart'
import PhaseLineManager from '../components/charts/PhaseLineManager'
import { canAmendData, canSuperviseData } from '../utils/permissions'

const dateRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
]

export default function ProgressPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    // Entering historical data is data entry, so coordinators may do it.
    // Declaring a phase change is a clinical judgement, so they may not.
    const canEnterPastData = canAmendData(user)
    const canManagePhases = canSuperviseData(user)
    const [dateRange, setDateRange] = useState('30')
    const [targetFilter, setTargetFilter] = useState('all')  // 'all' or a target id
    // Frequency programs can be charted as a raw count or as responses per
    // hour. Rate is the clinically comparable one, but count is what staff
    // recognise from the collection screen, so both are offered.
    const [frequencyMode, setFrequencyMode] = useState('count')  // 'count' | 'rate'
    // Entering a percentage for a past session rather than re-keying trials.
    const [showPastEntry, setShowPastEntry] = useState(false)
    const [pastEntry, setPastEntry] = useState({ date: '', percentage: '', notes: '' })
    const [savingPastEntry, setSavingPastEntry] = useState(false)
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

    // Chart rows, built by the same helper the chart itself uses so the stats
    // below can never disagree with what is plotted.
    const chartData = buildChartData(analytics)

    // When a target with an interval/latency measurement method is selected, the
    // analytics rows carry these fields and we switch the stats accordingly.
    const hasInterval = chartData.some(d => d.interval != null)
    const hasLatency = chartData.some(d => d.latency != null)

    // Calculate stats from real data
    const totalSessions = analytics?.overall_stats?.total_sessions || 0
    const latestAccuracy = chartData.length > 0 ? chartData[chartData.length - 1]?.accuracy : 0
    const trend = analytics?.overall_stats?.trend || 'stable'

    // Targets drive the filter dropdown below.
    const targets = analytics?.targets || []

    const handleExport = async () => {
        try {
            await exportProgramData(id, program?.name)
            toast.success('Export downloaded!')
        } catch (err) {
            toast.error(err.message || 'Export failed')
        }
    }

    // Download the on-screen chart as a PNG (with a header), the artifact
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
                    ? { title: 'Rate Over Time', yLabel: 'Responses per hour', unit: '/hr' }
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

    // Pull the chart's data again after a phase line changes, so the graph and
    // the list below it stay in step.
    const refreshAnalytics = async () => {
        try {
            const analyticsData = await getProgramProgress(id, {
                dateFrom: dateRange === 'all'
                    ? null
                    : format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd'),
                targetId: targetFilter === 'all' ? null : targetFilter,
            })
            setAnalytics(analyticsData)
        } catch (err) {
            toast.error('Could not refresh the graph')
        }
    }

    const handleSavePastEntry = async () => {
        const value = parseFloat(pastEntry.percentage)
        if (!pastEntry.date) {
            toast.error('Please choose the date of the session')
            return
        }
        if (Number.isNaN(value) || value < 0 || value > 100) {
            toast.error('Please enter a percentage between 0 and 100')
            return
        }

        setSavingPastEntry(true)
        try {
            await recordSummaryEntry({
                client_id: program.client_id,
                program_id: program.id,
                date: pastEntry.date,
                percentage: value,
                notes: pastEntry.notes || null,
            })
            setShowPastEntry(false)
            toast.success('Past session recorded')
            // Refetch so the new point appears without a manual reload.
            setDateRange(r => r)
            const analyticsData = await getProgramProgress(id, {
                dateFrom: dateRange === 'all' ? null : format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd'),
                targetId: targetFilter === 'all' ? null : targetFilter,
            })
            setAnalytics(analyticsData)
        } catch (err) {
            toast.error(err.message || 'Could not record that session')
        } finally {
            setSavingPastEntry(false)
        }
    }

    return (
        <DashboardLayout>
            {/* Add past data modal */}
            {showPastEntry && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => !savingPastEntry && setShowPastEntry(false)}
                    ></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-1">
                                Add Past Data
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Record the result of an earlier session for {program.name} without
                                entering it trial by trial.
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Session date</label>
                                <input
                                    type="date"
                                    value={pastEntry.date}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={(e) => setPastEntry(f => ({ ...f, date: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Percentage</label>
                                <input
                                    type="number"
                                    min="0" max="100" step="0.1"
                                    value={pastEntry.percentage}
                                    onChange={(e) => setPastEntry(f => ({ ...f, percentage: e.target.value }))}
                                    placeholder="e.g. 80"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={pastEntry.notes}
                                    onChange={(e) => setPastEntry(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="e.g. Transferred from paper records"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#159DB3] focus:outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Entered figures are marked on the graph with a hollow point, so they
                                    can be told apart from data collected in session.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPastEntry(false)}
                                    disabled={savingPastEntry}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePastEntry}
                                    disabled={savingPastEntry}
                                    className="flex-1 px-4 py-3 bg-[#159DB3] text-white font-semibold rounded-xl hover:bg-[#128098] transition-colors disabled:opacity-60"
                                >
                                    {savingPastEntry ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
                            {/* Percentages for sessions that predate the system,
                                without re-keying every trial. */}
                            {canEnterPastData && (
                                <button
                                    onClick={() => {
                                        setPastEntry({ date: '', percentage: '', notes: '' })
                                        setShowPastEntry(true)
                                    }}
                                    className="btn-outline-premium bg-white/10 border-white/30 text-white hover:bg-white/20 flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Past Data
                                </button>
                            )}
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
                    {/* Per-target filter, lets therapists drill into a single
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
                                {[['count', 'Count'], ['rate', 'Rate / hr']].map(([value, label]) => (
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
                        <ProgramChart
                            program={program}
                            analytics={analytics}
                            frequencyMode={frequencyMode}
                            emptyAction={
                                <button
                                    onClick={() => navigate('/sessions/new')}
                                    className="px-6 py-3 bg-gradient-to-r from-[#159DB3] to-[#214B9D] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Start a Session
                                </button>
                            }
                        />
                    </div>

                    {/* Phase changes: the clinician places these, so they are
                        managed beside the graph they appear on. */}
                    {canManagePhases && (
                        <PhaseLineManager
                            programId={program.id}
                            lines={analytics?.phase_lines || []}
                            onChanged={refreshAnalytics}
                        />
                    )}
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
