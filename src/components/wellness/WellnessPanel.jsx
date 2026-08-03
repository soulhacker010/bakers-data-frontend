import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Smile, Image as ImageIcon, HeartHandshake, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { getClientWellness } from '../../services/wellness'
import { downloadChartPng } from '../../utils/chartExport'
import { useToast } from '../../context/ToastContext'

const MOOD_EMOJI = { 1: '😢', 2: '😐', 3: '🙂', 4: '😊' }
const MOOD_LABEL = { 1: 'Distressed', 2: 'Struggling', 3: 'Okay', 4: 'Positive' }
const SUPPORT_LABEL = {
    break: 'A break',
    quiet_space: 'A quiet space',
    someone_nearby: 'Someone nearby',
    not_sure: 'Not sure',
}

/**
 * Wellness tab on the client profile: mood plotted over time in the SAME
 * chart style as the program graphs (client asked for consistent reporting),
 * with the same Download Graph export, plus most-requested supports and the
 * recent check-in list.
 */
export default function WellnessPanel({ clientId, clientName }) {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const chartRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(false)
        getClientWellness(clientId)
            .then((d) => { if (!cancelled) setData(d) })
            .catch(() => { if (!cancelled) setError(true) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [clientId])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#159DB3]" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-gray-600 text-sm">Couldn't load wellness data. Please try again.</p>
            </div>
        )
    }

    const checkins = data?.checkins || []
    const chartData = (data?.mood_series || []).map(p => ({
        date: format(parseISO(p.date + 'T12:00:00'), 'MMM d'),
        mood: p.mood_score,
    }))
    const supports = Object.entries(data?.support_counts || {}).sort((a, b) => b[1] - a[1])

    const handleDownloadGraph = async () => {
        try {
            const svg = chartRef.current?.querySelector('svg')
            await downloadChartPng(svg, {
                title: clientName || 'Client',
                subtitle: `Wellness: Mood Over Time · exported ${format(new Date(), 'MMM d, yyyy')}`,
            })
            toast.success('Graph downloaded!')
        } catch (err) {
            toast.error(err.message || 'Could not download the graph')
        }
    }

    if (checkins.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#E0F4F7] flex items-center justify-center mb-4 mx-auto">
                    <Smile size={32} className="text-[#159DB3]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-gray-800 mb-2">No Check-Ins Yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Start a wellness check-in before a session to begin building this client's readiness picture.
                </p>
                <button
                    onClick={() => navigate(`/clients/${clientId}/wellness-checkin`)}
                    className="px-6 py-3 bg-gradient-to-r from-[#159DB3] to-[#214B9D] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                    Start a Check-In
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Mood over time - same chart language as the program graphs */}
            <div className="card-premium p-8">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <h2 className="font-heading text-xl font-bold text-gray-900">Mood Over Time</h2>
                    <button
                        onClick={handleDownloadGraph}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#159DB3] hover:text-[#159DB3] transition-colors"
                    >
                        <ImageIcon size={16} />
                        Download Graph
                    </button>
                </div>
                <div className="h-72" ref={chartRef}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} stroke="#9CA3AF" fontSize={12}
                                   tickLine={false} axisLine={false}
                                   tickFormatter={(v) => MOOD_EMOJI[v] || v} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`${MOOD_EMOJI[value]} ${MOOD_LABEL[value]}`, 'Mood']}
                            />
                            <Area type="monotone" dataKey="mood" stroke="#159DB3" strokeWidth={3}
                                  fill="url(#colorMood)" dot={{ fill: '#159DB3', r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most requested supports */}
                <div className="card-premium p-6">
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <HeartHandshake size={18} className="text-[#159DB3]" />
                        Most Requested Supports
                    </h3>
                    {supports.length === 0 ? (
                        <p className="text-gray-500 text-sm">No support requests recorded.</p>
                    ) : (
                        <div className="space-y-3">
                            {supports.map(([key, count]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-gray-800 font-medium">{SUPPORT_LABEL[key] || key}</span>
                                    <span className="text-[#159DB3] font-bold">{count}×</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent check-ins */}
                <div className="card-premium p-6">
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Smile size={18} className="text-[#159DB3]" />
                        Recent Check-Ins
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {checkins.slice(0, 12).map(c => (
                            <div key={c.id}
                                 className={`flex items-center justify-between p-3 rounded-xl border ${c.clinical_flag ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{MOOD_EMOJI[c.mood_score]}</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{MOOD_LABEL[c.mood_score]}</p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(c.created_at), 'MMM d, yyyy · h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                {c.support_requested && (
                                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                        {SUPPORT_LABEL[c.support_requested]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
