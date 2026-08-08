import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { getClient } from '../services/clients'
import { getPrograms } from '../services/programs'
import { getProgramProgress } from '../services/analytics'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, BarChart2, ChevronRight } from 'lucide-react'
import { format, subDays } from 'date-fns'
import ProgramChart from '../components/charts/ProgramChart'

/**
 * Every graph for one learner, on one page.
 *
 * Dena (BCBA, Cor Behavioral): "Is there a way to view and access all graphs
 * for a learner in one area so that we don't have to open each individually."
 *
 * Charts are rendered by the same component the per-program page uses, so the
 * two can never drift apart.
 */

const dateRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
]

export default function ClientGraphsPage() {
    const { clientId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [client, setClient] = useState(null)
    const [entries, setEntries] = useState([])   // [{ program, analytics }]
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('30')
    const [frequencyMode, setFrequencyMode] = useState('count')

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                setLoading(true)

                const dateFrom = dateRange === 'all'
                    ? null
                    : format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd')

                const [clientData, programs] = await Promise.all([
                    getClient(clientId),
                    getPrograms({ clientId }),
                ])

                // One failing program must not blank the whole page, so each
                // result is settled independently and any that fail are simply
                // left out rather than throwing.
                const results = await Promise.allSettled(
                    programs.map(p => getProgramProgress(p.id, { dateFrom }))
                )

                if (cancelled) return

                setClient(clientData)
                setEntries(programs.map((program, i) => ({
                    program,
                    analytics: results[i].status === 'fulfilled' ? results[i].value : null,
                })))
            } catch (err) {
                if (cancelled) return
                console.error('Failed to load graphs:', err)
                toast.error('Failed to load graphs for this client')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [clientId, dateRange, toast])

    const clientName = client ? `${client.first_name} ${client.last_name}` : ''
    const hasFrequencyProgram = entries.some(e => e.program?.data_type === 'frequency')

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="bg-gradient-to-r from-[#159DB3] to-[#214B9D] px-6 py-8">
                <div className="max-w-screen-xl mx-auto">
                    <button
                        onClick={() => navigate(`/clients/${clientId}`)}
                        className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to {clientName || 'client'}
                    </button>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                All Graphs
                            </h1>
                            <p className="text-white/70">
                                {clientName} · {entries.length} {entries.length === 1 ? 'program' : 'programs'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {hasFrequencyProgram && (
                                <div className="flex items-center gap-1 bg-white/15 rounded-xl p-1">
                                    {[['count', 'Count'], ['rate', 'Rate / min']].map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setFrequencyMode(value)}
                                            aria-pressed={frequencyMode === value}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${frequencyMode === value
                                                ? 'bg-white text-[#159DB3]'
                                                : 'text-white/80 hover:text-white'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2.5 rounded-xl bg-white/15 text-white border border-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                {dateRangeOptions.map(o => (
                                    <option key={o.value} value={o.value} className="text-gray-900">
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                {entries.length === 0 ? (
                    <div className="card-premium p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#E0F4F7] flex items-center justify-center mx-auto mb-4">
                            <BarChart2 size={32} className="text-[#159DB3]" />
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-gray-800 mb-2">
                            No Programs Yet
                        </h3>
                        <p className="text-gray-500">
                            Once this client has programs, every graph will appear here together.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {entries.map(({ program, analytics }) => (
                            <div key={program.id} className="card-premium p-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div>
                                        <h2 className="font-heading text-lg font-bold text-gray-900">
                                            {program.name}
                                        </h2>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                                            {program.data_type?.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <Link
                                        to={`/programs/${program.id}/progress`}
                                        className="flex items-center gap-1 text-sm font-semibold text-[#159DB3] hover:text-[#128098] whitespace-nowrap"
                                    >
                                        Open
                                        <ChevronRight size={16} />
                                    </Link>
                                </div>

                                <div className="h-64">
                                    {analytics ? (
                                        <ProgramChart
                                            program={program}
                                            analytics={analytics}
                                            frequencyMode={frequencyMode}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-sm text-gray-400">
                                            This graph could not be loaded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
