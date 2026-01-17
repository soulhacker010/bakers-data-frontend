import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '../components/layout'
import { getAuditLogs } from '../services/admin'
import { useToast } from '../context/ToastContext'
import {
    Shield,
    Search,
    ChevronLeft,
    ChevronRight,
    LogIn,
    LogOut,
    Eye,
    Edit,
    Trash2,
    AlertTriangle,
    UserPlus,
    Play,
    Download,
    RefreshCw,
    X
} from 'lucide-react'
import { format, subDays, subWeeks, subMonths, isAfter } from 'date-fns'

// Simple action badge colors
const ACTION_STYLES = {
    'LOGIN': { icon: LogIn, bg: 'bg-green-100', text: 'text-green-700', label: 'Login' },
    'LOGOUT': { icon: LogOut, bg: 'bg-gray-100', text: 'text-gray-600', label: 'Logout' },
    'LOGIN_FAILED': { icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    'READ': { icon: Eye, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Viewed' },
    'CREATE': { icon: UserPlus, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Created' },
    'UPDATE': { icon: Edit, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Updated' },
    'DELETE': { icon: Trash2, bg: 'bg-red-100', text: 'text-red-700', label: 'Deleted' },
}

// Quick filter tabs
const QUICK_FILTERS = [
    { key: 'all', label: 'All Activity', icon: Shield },
    { key: 'logins', label: 'Logins', icon: LogIn },
    { key: 'failed', label: 'Failed Logins', icon: AlertTriangle },
    { key: 'sessions', label: 'Sessions', icon: Play },
    { key: 'phi', label: 'PHI Access', icon: Eye },
]

export default function AuditLogsPage() {
    const { toast } = useToast()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchEmail, setSearchEmail] = useState('')
    const [quickFilter, setQuickFilter] = useState('all')
    const [page, setPage] = useState(0)
    const limit = 100

    // Fetch logs
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true)
                const params = { limit: 500 }
                if (searchEmail) params.user_email = searchEmail
                const data = await getAuditLogs(params)
                setLogs(data)
            } catch (err) {
                toast.error('Failed to load audit logs')
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [searchEmail, toast])

    // Calculate stats
    const stats = useMemo(() => {
        return {
            total: logs.length,
            logins: logs.filter(l => l.action === 'LOGIN').length,
            failed: logs.filter(l => l.action === 'LOGIN_FAILED').length,
            sessions: logs.filter(l => l.resource_type === 'session').length,
            phi: logs.filter(l => l.action === 'READ' && l.resource_type === 'client').length,
        }
    }, [logs])

    // Apply quick filter
    const filteredLogs = useMemo(() => {
        let result = logs

        switch (quickFilter) {
            case 'logins':
                result = logs.filter(l => l.action === 'LOGIN')
                break
            case 'failed':
                result = logs.filter(l => l.action === 'LOGIN_FAILED')
                break
            case 'sessions':
                result = logs.filter(l => l.resource_type === 'session')
                break
            case 'phi':
                result = logs.filter(l => l.action === 'READ' && l.resource_type === 'client')
                break
            default:
                break
        }

        // Paginate
        return result.slice(page * limit, (page + 1) * limit)
    }, [logs, quickFilter, page])

    // Export with audit logging
    const exportToCSV = async () => {
        try {
            // Fetch with export flag to log the export action
            const exportData = await getAuditLogs({ limit: 500, export: true })

            const headers = ['Time', 'User', 'Action', 'Resource', 'Details', 'IP', 'Browser']
            const rows = exportData.map(log => [
                format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
                log.user_email || 'Unknown',
                log.action,
                log.resource_type,
                log.description || '',
                log.ip_address || '',
                log.user_agent || ''
            ])
            const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
            a.click()
            toast.success('Exported! (This export was logged)')
        } catch (err) {
            toast.error('Export failed')
        }
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="hero-gradient px-6 py-6">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                            <p className="text-white/70 text-sm">HIPAA Compliance Activity Tracking</p>
                        </div>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b px-6 py-4">
                <div className="max-w-screen-xl mx-auto flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500 uppercase">Total</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200" />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.logins}</p>
                        <p className="text-xs text-gray-500 uppercase">Logins</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                        <p className="text-xs text-gray-500 uppercase">Failed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.sessions}</p>
                        <p className="text-xs text-gray-500 uppercase">Sessions</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{stats.phi}</p>
                        <p className="text-xs text-gray-500 uppercase">PHI Access</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 border-b px-6 py-3">
                <div className="max-w-screen-xl mx-auto flex items-center gap-4 flex-wrap">
                    {/* Quick Filter Tabs */}
                    <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {QUICK_FILTERS.map(filter => {
                            const Icon = filter.icon
                            const isActive = quickFilter === filter.key
                            return (
                                <button
                                    key={filter.key}
                                    onClick={() => { setQuickFilter(filter.key); setPage(0) }}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0 transition ${isActive
                                        ? 'bg-[#159DB3] text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {filter.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-sm relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchEmail}
                            onChange={(e) => { setSearchEmail(e.target.value); setPage(0) }}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                        />
                        {searchEmail && (
                            <button
                                onClick={() => setSearchEmail('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Loading...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Shield size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No logs found</p>
                            {quickFilter !== 'all' && (
                                <button
                                    onClick={() => setQuickFilter('all')}
                                    className="mt-2 text-[#159DB3] text-sm hover:underline"
                                >
                                    Show all logs
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">When</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Who</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">What</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log, i) => {
                                        const style = ACTION_STYLES[log.action] || ACTION_STYLES['UPDATE']
                                        const Icon = style.icon
                                        return (
                                            <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {log.user_email || 'System'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                                                        <Icon size={12} />
                                                        {style.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 capitalize">
                                                    {log.resource_type.replace('_', ' ')}
                                                    {log.resource_id && <span className="text-gray-400"> #{log.resource_id}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                                                    {log.description || '-'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Page {page + 1} • {filteredLogs.length} logs
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={filteredLogs.length < limit}
                                        className="p-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
