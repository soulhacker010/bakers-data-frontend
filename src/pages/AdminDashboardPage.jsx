import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout';
import { Button, Card, ConfirmModal } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    BarChart3,
    Shield,
    Activity,
    Loader2,
    Check,
    X,
    Trash2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Calendar,
    FileText,
    TrendingUp,
    Play,
    ArrowRight
} from 'lucide-react';
import {
    getDetailedStats,
    getPendingUsers,
    approveUser,
    rejectUser,
    deactivateUser,
    activateUser,
    deleteUser,
    toggleAdmin
} from '../services/admin';

// Clickable stat card - always white bg for visibility on gradient header
function StatCard({ title, value, subtitle, icon: Icon, active, onClick, accent }) {
    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden p-5 rounded-2xl border bg-white shadow-sm transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1
                ${active
                    ? 'border-[#159DB3] shadow-md ring-2 ring-[#159DB3]/20'
                    : accent
                        ? 'border-teal-300 hover:border-teal-400'
                        : 'border-gray-200 hover:border-gray-300'
                }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
                    <p className={`font-heading text-2xl font-bold mt-1 ${active ? 'text-[#159DB3]' : 'text-gray-900'}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-2 rounded-xl ${active ? 'bg-[#159DB3]/10' : accent ? 'bg-teal-50' : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-[#159DB3]' : accent ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
            </div>

            {/* Active indicator */}
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#159DB3] to-[#214B9D]"></div>}
        </div>
    );
}

// Role badge
function RoleBadge({ role }) {
    const styles = {
        'admin': 'bg-purple-100 text-purple-700',
        'bcba': 'bg-blue-100 text-blue-700',
        'BCBA': 'bg-blue-100 text-blue-700',
        'RBT': 'bg-green-100 text-green-700',
        'Therapist': 'bg-teal-100 text-teal-700',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
            {role}
        </span>
    );
}

// Status badge
function StatusBadge({ isActive, isApproved }) {
    if (!isApproved) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Pending</span>;
    if (!isActive) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Inactive</span>;
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>;
}

// Pending approval card
function PendingCard({ user, onApprove, onReject, loading }) {
    return (
        <div className="group relative overflow-hidden p-4 rounded-2xl bg-white border border-amber-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-110 transition-transform">
                        {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <RoleBadge role={user.role} />
                            <span className="text-xs text-gray-400">• {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onApprove(user.id)}
                        disabled={loading === user.id}
                        className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 transition-all disabled:opacity-50"
                    >
                        {loading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onReject}
                        disabled={loading === user.id}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Table wrapper with design system styling
function DataTable({ children, title, count }) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-lg">
            {/* Decorative gradient blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#159DB3]/10 to-[#214B9D]/10 rounded-full blur-3xl"></div>

            <div className="relative p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-heading font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{count} total records</p>
            </div>
            <div className="relative overflow-x-auto">
                {children}
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeView, setActiveView] = useState('users');
    const [data, setData] = useState({
        summary: { total_users: 0, total_clients: 0, total_programs: 0, total_sessions: 0, sessions_today: 0, new_users_week: 0, pending_users: 0 },
        users: [],
        clients: [],
        sessions: [],
        programs: []
    });
    const [pendingUsers, setPendingUsers] = useState([]);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        confirmText: 'Confirm',
        onConfirm: () => { }
    });

    const openConfirmModal = (config) => setConfirmModal({ isOpen: true, ...config });
    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    // Check is_admin flag (NOT role!) - admin status is separate from professional role
    if (!user?.is_admin) {
        return <Navigate to="/dashboard" replace />;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const [detailedData, pending] = await Promise.all([
                getDetailedStats(),
                getPendingUsers()
            ]);
            setData(detailedData);
            setPendingUsers(pending);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try { await approveUser(userId); toast.success('User approved'); fetchData(); }
        catch (err) { toast.error(err.message || 'Failed to approve user'); }
        finally { setActionLoading(null); }
    };

    const confirmReject = (userId, userName) => {
        openConfirmModal({
            title: 'Reject User',
            message: `Are you sure you want to reject ${userName || 'this user'}? They will not be able to access the platform.`,
            type: 'warning',
            confirmText: 'Reject',
            onConfirm: () => handleReject(userId)
        });
    };

    const handleReject = async (userId) => {
        setActionLoading(userId);
        try { await rejectUser(userId); toast.success('User rejected'); fetchData(); }
        catch (err) { toast.error(err.message || 'Failed to reject user'); }
        finally { setActionLoading(null); }
    };

    const confirmDeactivate = (userId, userName) => {
        openConfirmModal({
            title: 'Deactivate User',
            message: `Are you sure you want to deactivate ${userName || 'this user'}? They will not be able to login until reactivated.`,
            type: 'warning',
            confirmText: 'Deactivate',
            onConfirm: () => handleDeactivate(userId)
        });
    };

    const handleDeactivate = async (userId) => {
        setActionLoading(userId);
        try { await deactivateUser(userId); toast.success('User deactivated'); fetchData(); }
        catch (err) { toast.error(err.message || 'Failed to deactivate user'); }
        finally { setActionLoading(null); }
    };

    const handleActivate = async (userId) => {
        setActionLoading(userId);
        try { await activateUser(userId); toast.success('User activated'); fetchData(); }
        catch (err) { toast.error(err.message || 'Failed to activate user'); }
        finally { setActionLoading(null); }
    };

    const confirmDelete = (userId, userName) => {
        openConfirmModal({
            title: 'Delete User',
            message: `Are you sure you want to permanently delete ${userName || 'this user'}? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: () => handleDelete(userId, true)
        });
    };

    const handleDelete = async (userId, hard) => {
        setActionLoading(userId);
        try { await deleteUser(userId, hard); toast.success('User deleted'); fetchData(); }
        catch (err) { toast.error(err.message || 'Failed to delete user'); }
        finally { setActionLoading(null); }
    };

    const handleToggleAdmin = async (userId, currentAdminStatus) => {
        const action = currentAdminStatus ? 'revoke admin from' : 'grant admin to';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        setActionLoading(userId);
        try {
            const result = await toggleAdmin(userId);
            toast.success(result.message);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to toggle admin');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#159DB3]" />
                </div>
            </DashboardLayout>
        );
    }

    const { summary, users, clients, sessions, programs } = data;

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-8">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="label-uppercase-light mb-1">A D M I N</p>
                                <h1 className="font-heading text-3xl font-bold text-white">System Dashboard</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => window.location.href = '/admin/audit-logs'}
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                                <Shield className="w-4 h-4 mr-2" /> Audit Logs
                            </Button>
                            <Button onClick={fetchData} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Clickable Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <StatCard
                            title="Therapists"
                            value={summary.total_users}
                            icon={Users}
                            active={activeView === 'users'}
                            onClick={() => setActiveView('users')}
                        />
                        <StatCard
                            title="Clients"
                            value={summary.total_clients}
                            icon={Activity}
                            active={activeView === 'clients'}
                            onClick={() => setActiveView('clients')}
                        />
                        <StatCard
                            title="Programs"
                            value={summary.total_programs}
                            icon={FileText}
                            active={activeView === 'programs'}
                            onClick={() => setActiveView('programs')}
                        />
                        <StatCard
                            title="Sessions"
                            value={summary.total_sessions}
                            icon={BarChart3}
                            active={activeView === 'sessions'}
                            onClick={() => setActiveView('sessions')}
                        />
                        <StatCard
                            title="Today"
                            value={summary.sessions_today}
                            subtitle="sessions"
                            icon={Calendar}
                            accent
                            onClick={() => setActiveView('sessions')}
                        />
                        <StatCard
                            title="New Week"
                            value={summary.new_users_week}
                            subtitle="users"
                            icon={TrendingUp}
                            onClick={() => setActiveView('users')}
                        />
                        <StatCard
                            title="Pending"
                            value={summary.pending_users}
                            subtitle="approvals"
                            icon={Clock}
                            accent={summary.pending_users > 0}
                            onClick={() => setActiveView('pending')}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {/* Pending Approvals - Always show when pending view is active */}
                {activeView === 'pending' && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="font-heading text-xl font-bold text-gray-900">Pending Approvals</h2>
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">{pendingUsers.length}</span>
                        </div>
                        {pendingUsers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingUsers.map(u => (
                                    <PendingCard key={u.id} user={u} onApprove={handleApprove} onReject={() => confirmReject(u.id, u.full_name)} loading={actionLoading} />
                                ))}
                            </div>
                        ) : (
                            <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-12 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <UserCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-500">No pending registrations to review. New therapist sign-ups will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Also show pending on users view if there are any */}
                {activeView === 'users' && pendingUsers.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="font-heading text-xl font-bold text-gray-900">Pending Approvals</h2>
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">{pendingUsers.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingUsers.map(u => (
                                <PendingCard key={u.id} user={u} onApprove={handleApprove} onReject={() => confirmReject(u.id, u.full_name)} loading={actionLoading} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Therapists View */}
                {activeView === 'users' && (
                    <DataTable title="All Therapists" count={users.length}>
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Therapist</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Clients</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Programs</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sessions</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Active</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold">
                                                    {u.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <RoleBadge role={u.role} />
                                                {u.is_admin && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Admin</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{u.client_count}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{u.program_count}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{u.session_count}</td>
                                        <td className="px-4 py-3"><StatusBadge isActive={u.is_active} isApproved={u.is_approved} /></td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{u.last_session ? new Date(u.last_session).toLocaleDateString() : 'Never'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                {u.id !== user.id && (
                                                    <button
                                                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                                        className={`p-1.5 rounded-lg ${u.is_admin ? 'hover:bg-purple-50 text-purple-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                                        title={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {u.is_active ? (
                                                    <button onClick={() => confirmDeactivate(u.id, u.full_name)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Deactivate">
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleActivate(u.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Activate">
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {u.id !== user.id && (
                                                    <button onClick={() => confirmDelete(u.id, u.full_name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataTable>
                )}

                {/* Clients View */}
                {activeView === 'clients' && (
                    <DataTable title="All Clients" count={clients.length}>
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Therapist</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Programs</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sessions</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Session</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {clients.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shadow">
                                                    {c.name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900">{c.therapist_name}</p>
                                            <p className="text-xs text-gray-500">{c.therapist_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{c.program_count}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{c.session_count}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{c.last_session ? new Date(c.last_session).toLocaleDateString() : 'Never'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataTable>
                )}

                {/* Sessions View */}
                {activeView === 'sessions' && (
                    <DataTable title="All Sessions" count={sessions.length}>
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Therapist</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Duration</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sessions.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Play className="w-4 h-4 text-teal-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{new Date(s.start_time).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">{new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900">{s.therapist_name}</p>
                                            <p className="text-xs text-gray-500">{s.therapist_email}</p>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.client_name}</td>
                                        <td className="px-4 py-3 text-center">
                                            {s.duration_minutes ? (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">{s.duration_minutes} min</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{s.notes || '—'}</td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500">No sessions yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </DataTable>
                )}

                {/* Programs View */}
                {activeView === 'programs' && (
                    <DataTable title="All Programs" count={programs.length}>
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Program</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Therapist</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sessions</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {programs.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-purple-500" />
                                                <span className="font-medium text-gray-900">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${p.type === 'behavior' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700'}`}>
                                                {p.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{p.client_name}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900">{p.therapist_name}</p>
                                            <p className="text-xs text-gray-500">{p.therapist_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{p.session_count}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {programs.length === 0 && (
                                    <tr><td colSpan="6" className="px-4 py-12 text-center text-gray-500">No programs yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </DataTable>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </DashboardLayout>
    );
}
