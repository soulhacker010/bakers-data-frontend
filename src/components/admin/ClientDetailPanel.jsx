import { useEffect, useState } from 'react';
import {
    Loader2, AlertCircle, FileText, CalendarDays, User, StickyNote,
} from 'lucide-react';
import { getClientDetail } from '../../services/admin';
import { StatTile, Section, fmtDate, fmtDuration } from './panelPrimitives';
import { ProgramTypeBadge, ProgramStatusBadge, DataTypeBadge } from './programBadges';

/**
 * Fetches and renders the full detail for one client in the drawer.
 * Lazy: only loads when opened.
 */
export default function ClientDetailPanel({ clientId }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        getClientDetail(clientId)
            .then((data) => { if (!cancelled) setDetail(data); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [clientId]);

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
                <p className="text-gray-600 text-sm">Couldn't load this client. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Status + key facts */}
            <div className="flex flex-wrap items-center gap-2">
                {detail.is_active
                    ? <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">Active</span>
                    : <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">Inactive</span>}
                {detail.age != null && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {detail.age} yrs
                    </span>
                )}
                {detail.diagnosis && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {detail.diagnosis}
                    </span>
                )}
            </div>

            {/* Stat tiles */}
            <div className="flex gap-3">
                <StatTile label="Programs" value={detail.program_count} />
                <StatTile label="Sessions" value={detail.session_count} />
            </div>

            {/* Notes */}
            {detail.notes && (
                <Section title="Notes" icon={StickyNote}>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{detail.notes}</p>
                </Section>
            )}

            {/* Programs */}
            <Section title={`Programs (${detail.program_count})`} icon={FileText}>
                {detail.programs.length === 0 ? (
                    <p className="text-sm text-gray-400">No programs yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {detail.programs.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <ProgramTypeBadge type={p.type} />
                                        <DataTypeBadge dataType={p.data_type} />
                                        <ProgramStatusBadge status={p.status} />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 shrink-0">
                                    {p.session_count} {p.session_count === 1 ? 'session' : 'sessions'}
                                </span>
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
                                    <p className="text-xs text-gray-500 truncate">{s.therapist_name || '—'}</p>
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
            <Section title="Details" icon={User}>
                <dl className="text-sm space-y-2">
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Therapist</dt>
                        <dd className="text-gray-900 text-right truncate">
                            {detail.therapist?.name || '—'}
                            {detail.therapist?.email && (
                                <span className="block text-xs text-gray-400">{detail.therapist.email}</span>
                            )}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Date of birth</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.date_of_birth)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Added</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.created_at)}</dd>
                    </div>
                </dl>
            </Section>
        </div>
    );
}
