import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { mockPrograms } from '../data/mockData'
import { Download, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

// Mock progress data
const mockProgressData = [
    { date: 'Jan 1', accuracy: 45 },
    { date: 'Jan 8', accuracy: 52 },
    { date: 'Jan 15', accuracy: 60 },
    { date: 'Jan 22', accuracy: 68 },
    { date: 'Jan 29', accuracy: 75 },
    { date: 'Feb 5', accuracy: 78 },
    { date: 'Feb 12', accuracy: 82 },
    { date: 'Feb 19', accuracy: 85 },
]

const dateRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
]

export default function ProgressPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [dateRange, setDateRange] = useState('30')

    // Get program data
    const program = mockPrograms.find(p => p.id === parseInt(id)) || mockPrograms[0]

    // Calculate stats
    const latestAccuracy = mockProgressData[mockProgressData.length - 1]?.accuracy || 0
    const totalSessions = mockProgressData.length
    const firstAccuracy = mockProgressData[0]?.accuracy || 0
    const trend = latestAccuracy > firstAccuracy + 5 ? 'improving' : latestAccuracy < firstAccuracy - 5 ? 'declining' : 'stable'

    const handleExport = () => {
        alert('Export feature will be connected to backend API')
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

            {/* Controls */}
            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm text-gray-700 min-w-[180px] cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                        {dateRangeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chart */}
            <div className="px-6 pb-6 max-w-screen-xl mx-auto">
                <div className="card-premium p-8">
                    <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">Progress Over Time</h2>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockProgressData}>
                                <defs>
                                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#159DB3" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#159DB3" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                        padding: '12px 16px'
                                    }}
                                    formatter={(value) => [`${value}%`, 'Accuracy']}
                                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#159DB3"
                                    strokeWidth={3}
                                    fill="url(#colorAccuracy)"
                                    dot={{ fill: '#159DB3', strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, fill: '#159DB3', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-10 max-w-screen-xl mx-auto">
                <div className="card-premium p-6">
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Overall Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-primary">{latestAccuracy}%</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Latest Accuracy</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className="font-heading text-3xl font-bold text-gray-900">{totalSessions}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Sessions</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-xl">
                            <p className={`font-heading text-2xl font-bold flex items-center justify-center gap-2 ${trend === 'improving' ? 'text-green-600' :
                                    trend === 'declining' ? 'text-red-500' : 'text-gray-600'
                                }`}>
                                {trend === 'improving' && <><TrendingUp size={24} /> Improving</>}
                                {trend === 'declining' && <><TrendingDown size={24} /> Declining</>}
                                {trend === 'stable' && <><Minus size={24} /> Stable</>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Trend</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
