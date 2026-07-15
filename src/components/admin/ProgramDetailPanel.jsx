import { useEffect, useState } from 'react';
import {
    Loader2, Target as TargetIcon, ListChecks, CheckCircle2,
    CalendarDays, User, AlertCircle,
} from 'lucide-react';
import { getProgramDetail } from '../../services/admin';
import { ProgramTypeBadge, ProgramStatusBadge, DataTypeBadge } from './programBadges';
import { StatTile, Section, fmtDate } from './panelPrimitives';

/**
 * Fetches and renders the full detail for one program inside the drawer.
 * Lazy: it only loads when mounted (i.e. when a program is opened), so the main
 * list payload stays light.
 */
export default function ProgramDetailPanel({ programId }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        getProgramDetail(programId)
            .then((data) => { if (!cancelled) setDetail(data); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [programId]);

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
                <p className="text-gray-600 text-sm">Couldn't load this program. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Attribute badges */}
            <div className="flex flex-wrap items-center gap-2">
                <ProgramTypeBadge type={detail.program_type} />
                <DataTypeBadge dataType={detail.data_type} />
                <ProgramStatusBadge status={detail.status} />
                {!detail.is_active && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                        Out of rotation
                    </span>
                )}
            </div>

            {/* Stat tiles */}
            <div className="flex gap-3">
                <StatTile label="Sessions" value={detail.session_count} hint="with recorded data" />
                <StatTile
                    label="Targets"
                    value={detail.target_count}
                    hint={`${detail.mastered_count} mastered`}
                />
            </div>

            {/* Description / mastery criteria */}
            {(detail.description || detail.mastery_criteria) && (
                <Section title="Overview" icon={TargetIcon}>
                    {detail.description && (
                        <p className="text-sm text-gray-700 whitespace-pre-line">{detail.description}</p>
                    )}
                    {detail.mastery_criteria && (
                        <div className="mt-3 rounded-xl bg-teal-50/60 border border-teal-100 p-3">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Mastery criteria</p>
                            <p className="text-sm text-gray-700 mt-0.5">{detail.mastery_criteria}</p>
                        </div>
                    )}
                </Section>
            )}

            {/* Targets */}
            <Section title={`Targets (${detail.target_count})`} icon={ListChecks}>
                {detail.targets.length === 0 ? (
                    <p className="text-sm text-gray-400">No targets defined.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {detail.targets.map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0 flex items-center gap-2">
                                    {t.is_mastered
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        : <span className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0" />}
                                    <span className="text-sm text-gray-800 truncate">{t.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {typeof t.current_accuracy === 'number' && t.current_accuracy > 0 && (
                                        <span className="text-xs text-gray-500">{Math.round(t.current_accuracy)}%</span>
                                    )}
                                    <ProgramStatusBadge status={t.status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            {/* Task steps (task-analysis programs) */}
            {detail.task_steps.length > 0 && (
                <Section title={`Task Steps (${detail.task_steps.length})`} icon={ListChecks}>
                    <ol className="space-y-1.5">
                        {detail.task_steps.map((s, i) => (
                            <li key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0">
                                    {i + 1}
                                </span>
                                <span className="truncate">{s.name}</span>
                            </li>
                        ))}
                    </ol>
                </Section>
            )}

            {/* Recent sessions */}
            <Section title="Recent sessions" icon={CalendarDays}>
                {detail.recent_sessions.length === 0 ? (
                    <p className="text-sm text-gray-400">No sessions have recorded data for this program yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {detail.recent_sessions.map((s) => (
                            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{fmtDate(s.start_time)}</p>
                                    <p className="text-xs text-gray-500 truncate">{s.therapist_name || '—'}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                                    {s.data_points} {s.data_points === 1 ? 'point' : 'points'}
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
                        <dt className="text-gray-500">Client</dt>
                        <dd className="text-gray-900 text-right truncate">{detail.client?.name || '—'}</dd>
                    </div>
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
                        <dt className="text-gray-500">Created</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">Last updated</dt>
                        <dd className="text-gray-900 text-right">{fmtDate(detail.updated_at)}</dd>
                    </div>
                </dl>
            </Section>
        </div>
    );
}
