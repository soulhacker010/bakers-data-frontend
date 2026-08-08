import { useEffect, useState } from 'react';
import {
    Loader2, AlertCircle, Users, CalendarDays, ShieldCheck, ShieldOff,
    BadgeCheck, Lock, Unlock,
} from 'lucide-react';
import { getUserDetail, setUserRole } from '../../services/admin';
import { StatTile, Section, fmtDate, fmtDuration } from './panelPrimitives';
import { useToast } from '../../context/ToastContext';

// Mirrors ASSIGNABLE_ROLES in app/core/roles.py. Coordinator sits between an
// RBT and a BCBA: it may correct recorded data but not remove it or declare a
// phase change (added at the clinical team's request, Aug 2026).
const ROLES = [
    { value: 'bcba', label: 'BCBA', hint: 'Full clinical supervision' },
    { value: 'coordinator', label: 'Coordinator', hint: 'May correct data, cannot remove it' },
    { value: 'supervisor', label: 'Supervisor', hint: 'Records data' },
    { value: 'rbt', label: 'RBT', hint: 'Records data' },
    { value: 'therapist', label: 'Therapist', hint: 'Records data' },
    { value: 'staff', label: 'Staff', hint: 'Limited access' },
    { value: 'other', label: 'Other', hint: 'Records data' },
];

function Pill({ children, tone = 'gray' }) {
    const tones = {
        gray: 'bg-gray-100 text-gray-700',
        green: 'bg-green-50 text-green-700',
        amber: 'bg-amber-50 text-amber-700',
        red: 'bg-red-50 text-red-700',
        purple: 'bg-purple-50 text-purple-700',
        teal: 'bg-teal-50 text-teal-700',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tones[tone]}`}>{children}</span>;
}

/**
 * Fetches and renders the full detail for one therapist/user in the drawer.
 * Lazy: only loads when opened.
 */
export default function TherapistDetailPanel({ userId }) {
    const { toast } = useToast();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [savingRole, setSavingRole] = useState(false);

    const handleRoleChange = async (role) => {
        setSavingRole(true);
        try {
            await setUserRole(userId, role);
            setDetail((d) => ({ ...d, role }));
            toast.success('Role updated');
        } catch (err) {
            toast.error(err.message || 'Could not update that role');
        } finally {
            setSavingRole(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        getUserDetail(userId)
            .then((data) => { if (!cancelled) setDetail(data); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#159DB3]" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-gray-600 text-sm">Couldn't load this therapist. Please try again.</p>
            </div>
        );
    }

    const statusTone = !detail.is_approved ? 'amber' : !detail.is_active ? 'red' : 'green';
    const statusText = !detail.is_approved ? 'Pending' : !detail.is_active ? 'Inactive' : 'Active';

    return (
        <div className="space-y-4">
            {/* Status + account badges */}
            <div className="flex flex-wrap items-center gap-2">
                <Pill tone="teal">{detail.role}</Pill>
                <Pill tone={statusTone}>{statusText}</Pill>
                {detail.is_superadmin && <Pill tone="amber">Owner</Pill>}
                {detail.is_admin && !detail.is_superadmin && <Pill tone="purple">Admin</Pill>}
            </div>

            {/* Role assignment. Roles used to be settable by the account holder
                on their own profile, which meant anyone could make themselves a
                BCBA. It is an administrator's decision now, and every change is
                written to the audit log. */}
            <div className="border border-gray-100 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Clinical Role
                </label>
                <select
                    value={(detail.role || '').toLowerCase()}
                    disabled={savingRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-[#159DB3] focus:outline-none disabled:opacity-60"
                >
                    {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                            {r.label} — {r.hint}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">
                    Determines who may correct or remove recorded data. Changes are logged.
                </p>
                <span className="inline-flex items-center gap-1">
                    {detail.is_verified
                        ? <Pill tone="green"><BadgeCheck className="w-3 h-3 inline -mt-0.5" /> Verified</Pill>
                        : <Pill tone="amber">Unverified</Pill>}
                </span>
                {detail.otp_enabled
                    ? <Pill tone="green"><Lock className="w-3 h-3 inline -mt-0.5" /> 2FA on</Pill>
                    : <Pill tone="gray"><Unlock className="w-3 h-3 inline -mt-0.5" /> 2FA off</Pill>}
            </div>

            {/* Stat tiles */}
            <div className="flex gap-3">
                <StatTile label="Clients" value={detail.client_count} />
                <StatTile label="Programs" value={detail.program_count} />
                <StatTile label="Sessions" value={detail.session_count} />
            </div>

            {/* Clients */}
            <Section title={`Clients (${detail.client_count})`} icon={Users}>
                {detail.clients.length === 0 ? (
                    <p className="text-sm text-gray-400">No clients assigned.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {detail.clients.map((c) => (
                            <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Last session {fmtDate(c.last_session)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                                    <span>{c.program_count} programs</span>
                                    <span>{c.session_count} sessions</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            {/* Recent sessions */}
            <Section title="Recent sessions" icon={CalendarDays}>
                {detail.recent_sessions.length === 0 ? (
                    <p className="text-sm text-gray-400">No sessions recorded yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {detail.recent_sessions.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{fmtDate(s.start_time)}</p>
                                    <p className="text-xs text-gray-500 truncate">{s.client_name || '—'}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                                    {fmtDuration(s.duration_minutes)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            {/* Meta */}
            <Section title="Account" icon={detail.is_active ? ShieldCheck : ShieldOff}>
                <dl className="text-sm space-y-2">
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Email</dt>
                        <dd className="text-gray-900 text-right truncate">{detail.email}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Joined</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Last active</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.last_session)}</dd>
                    </div>
                </dl>
            </Section>
        </div>
    );
}
