import { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { getClients } from '../services/clients'
import { getSessionSummary, getClientReport, getMonthlyReport, downloadSummary } from '../services/reports'
import { useToast } from '../context/ToastContext'
import { Download, FileText, BarChart3, Calendar, Users, ArrowRight, X, TrendingUp, Clock, Hash } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
    const { toast } = useToast()
    const [clients, setClients] = useState([])

    // Modal states
    const [sessionSummaryModal, setSessionSummaryModal] = useState(false)
    const [clientReportModal, setClientReportModal] = useState(false)
    const [monthlyModal, setMonthlyModal] = useState(false)
    const [resultModal, setResultModal] = useState(null) // Holds report result

    // Form states
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [selectedClient, setSelectedClient] = useState('')
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [loading, setLoading] = useState(false)

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await getClients()
                setClients(data)
            } catch (err) {
                console.error('Failed to load clients')
            }
        }
        fetchClients()
    }, [])

    // Generate Session Summary
    const handleSessionSummary = async () => {
        setLoading(true)
        try {
            const data = await getSessionSummary(dateFrom, dateTo)
            setResultModal({ type: 'session-summary', data })
            setSessionSummaryModal(false)
            toast.success('Report generated!')
        } catch (err) {
            toast.error('Failed to generate report')
        } finally {
            setLoading(false)
        }
    }

    // Generate Client Report
    const handleClientReport = async () => {
        if (!selectedClient) {
            toast.error('Please select a client')
            return
        }
        setLoading(true)
        try {
            const data = await getClientReport(selectedClient)
            setResultModal({ type: 'client-report', data })
            setClientReportModal(false)
            toast.success('Report generated!')
        } catch (err) {
            toast.error('Failed to generate report')
        } finally {
            setLoading(false)
        }
    }

    // Generate Monthly Report
    const handleMonthlyReport = async () => {
        setLoading(true)
        try {
            const data = await getMonthlyReport(selectedYear, selectedMonth)
            setResultModal({ type: 'monthly', data })
            setMonthlyModal(false)
            toast.success('Report generated!')
        } catch (err) {
            toast.error('Failed to generate report')
        } finally {
            setLoading(false)
        }
    }

    // Export CSV
    const handleExport = async () => {
        setLoading(true)
        try {
            await downloadSummary()
            toast.success('Summary export downloaded!')
        } catch (err) {
            toast.error('Export failed')
        } finally {
            setLoading(false)
        }
    }

    const reportTypes = [
        {
            icon: FileText,
            title: 'Session Summary',
            description: 'Generate a summary report of all sessions for a date range.',
            buttonText: 'Generate Report',
            variant: 'primary',
            onClick: () => setSessionSummaryModal(true)
        },
        {
            icon: BarChart3,
            title: 'Progress Report',
            description: 'Client progress report with graphs and statistics.',
            buttonText: 'Generate Report',
            variant: 'primary',
            onClick: () => setClientReportModal(true)
        },
        {
            icon: Users,
            title: 'Client Report',
            description: 'Comprehensive report for a specific client.',
            buttonText: 'Select Client',
            variant: 'primary',
            onClick: () => setClientReportModal(true)
        },
        {
            icon: Calendar,
            title: 'Monthly Summary',
            description: 'Overview of all activities for a specific month.',
            buttonText: 'Select Month',
            variant: 'primary',
            onClick: () => setMonthlyModal(true)
        },
        {
            icon: Download,
            title: 'Export All Data',
            description: 'Export all data to CSV for external analysis.',
            buttonText: 'Export CSV',
            variant: 'outline',
            onClick: handleExport
        }
    ]

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <p className="label-uppercase-light mb-2">R E P O R T S</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                        Reports & Exports
                    </h1>
                    <p className="text-white/70">
                        Generate reports and export your data
                    </p>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportTypes.map((report, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#159DB3]/20 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-xl bg-[#E0F4F7] text-[#159DB3] flex items-center justify-center mb-4 group-hover:bg-[#159DB3] group-hover:text-white transition-colors">
                                <report.icon size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 group-hover:text-[#159DB3] transition-colors">
                                {report.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                {report.description}
                            </p>
                            <Button variant={report.variant} size="sm" className="group/btn" onClick={report.onClick}>
                                {report.buttonText}
                                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Summary Modal */}
            {sessionSummaryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-heading text-xl font-bold">Session Summary Report</h2>
                            <button onClick={() => setSessionSummaryModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setSessionSummaryModal(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleSessionSummary} loading={loading} className="flex-1">Generate</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Report Modal */}
            {clientReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-heading text-xl font-bold">Client Report</h2>
                            <button onClick={() => setClientReportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                            <select
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                            >
                                <option value="">Choose a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.first_name} {client.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setClientReportModal(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleClientReport} loading={loading} className="flex-1">Generate</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Report Modal */}
            {monthlyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-heading text-xl font-bold">Monthly Summary Report</h2>
                            <button onClick={() => setMonthlyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                >
                                    {[2024, 2025, 2026].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" onClick={() => setMonthlyModal(false)} className="flex-1">Cancel</Button>
                            <Button onClick={handleMonthlyReport} loading={loading} className="flex-1">Generate</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {resultModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-heading text-xl font-bold">
                                {resultModal.type === 'session-summary' && 'Session Summary Report'}
                                {resultModal.type === 'client-report' && 'Client Report'}
                                {resultModal.type === 'monthly' && 'Monthly Summary Report'}
                            </h2>
                            <button onClick={() => setResultModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Session Summary Result */}
                        {resultModal.type === 'session-summary' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={16} />
                                    {resultModal.data.date_from} to {resultModal.data.date_to}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[#E0F4F7] rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-[#159DB3]">{resultModal.data.total_sessions}</p>
                                        <p className="text-xs text-gray-600">Sessions</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{resultModal.data.total_clients_seen}</p>
                                        <p className="text-xs text-gray-600">Clients</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-green-600">{resultModal.data.total_data_points}</p>
                                        <p className="text-xs text-gray-600">Data Points</p>
                                    </div>
                                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-orange-600">{resultModal.data.total_minutes}</p>
                                        <p className="text-xs text-gray-600">Minutes</p>
                                    </div>
                                </div>
                                {resultModal.data.top_clients.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Top Clients</h3>
                                        <div className="space-y-2">
                                            {resultModal.data.top_clients.map((c, i) => (
                                                <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span>{c.name}</span>
                                                    <span className="font-medium text-[#159DB3]">{c.session_count} sessions</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Client Report Result */}
                        {resultModal.type === 'client-report' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Users size={24} className="text-[#159DB3]" />
                                    <span className="text-xl font-semibold">{resultModal.data.client_name}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#E0F4F7] rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-[#159DB3]">{resultModal.data.total_sessions}</p>
                                        <p className="text-xs text-gray-600">Total Sessions</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{resultModal.data.total_programs}</p>
                                        <p className="text-xs text-gray-600">Programs</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-green-600">{resultModal.data.overall_progress.sessions_this_month}</p>
                                        <p className="text-xs text-gray-600">This Month</p>
                                    </div>
                                </div>
                                {resultModal.data.programs.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Programs</h3>
                                        <div className="space-y-2">
                                            {resultModal.data.programs.map((p, i) => (
                                                <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <span className="font-medium">{p.name}</span>
                                                        <span className="text-xs text-gray-500 ml-2">({p.data_type})</span>
                                                    </div>
                                                    {p.latest_accuracy !== null && (
                                                        <span className="font-medium text-green-600">{p.latest_accuracy}%</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Monthly Report Result */}
                        {resultModal.type === 'monthly' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
                                    <Calendar size={20} />
                                    {resultModal.data.month_name} {resultModal.data.year}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#E0F4F7] rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-[#159DB3]">{resultModal.data.total_sessions}</p>
                                        <p className="text-xs text-gray-600">Sessions</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-purple-600">{resultModal.data.total_clients}</p>
                                        <p className="text-xs text-gray-600">Clients Seen</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-green-600">{resultModal.data.total_data_points}</p>
                                        <p className="text-xs text-gray-600">Data Points</p>
                                    </div>
                                </div>
                                {resultModal.data.client_breakdown.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Sessions by Client</h3>
                                        <div className="space-y-2">
                                            {resultModal.data.client_breakdown.map((c, i) => (
                                                <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span>{c.name}</span>
                                                    <span className="font-medium text-[#159DB3]">{c.session_count} sessions</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button variant="outline" onClick={() => setResultModal(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
