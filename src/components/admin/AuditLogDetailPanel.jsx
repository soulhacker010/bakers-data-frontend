import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Activity, Globe, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedDate } from '../../utils/datetime';
import { getAuditLogDetail } from '../../services/admin';
import { Section } from './panelPrimitives';

// Light action badge colours (mirrors the list's palette).
const ACTION_TONE = {
    LOGIN: 'bg-green-50 text-green-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    LOGIN_FAILED: 'bg-red-50 text-red-700',
    READ: 'bg-purple-50 text-purple-700',
    CREATE: 'bg-blue-50 text-blue-700',
    UPDATE: 'bg-yellow-50 text-yellow-700',
    DELETE: 'bg-red-50 text-red-700',
    EXPORT: 'bg-teal-50 text-teal-700',
};

function Row({ label, children, mono = false }) {
    return (
        <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-gray-500 shrink-0">{label}</dt>
            <dd className={`text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{children}</dd>
        </div>
    );
}

/**
 * Fetches and renders the FULL, unmasked detail for a single audit log entry
 * (complete IP + device string) — for authorized compliance investigation.
 * Lazy: only loads when opened.
 */
export default function AuditLogDetailPanel({ logId }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        getAuditLogDetail(logId)
            .then((data) => { if (!cancelled) setDetail(data); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [logId]);

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
                <p className="text-gray-600 text-sm">Couldn't load this log entry. Please try again.</p>
            </div>
        );
    }

    const tone = ACTION_TONE[detail.action] || 'bg-gray-100 text-gray-700';
    const when = detail.created_at ? format(toZonedDate(detail.created_at), 'PPpp') : '—';

    return (
        <div className="space-y-4">
            {/* Action + resource */}
            <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${tone}`}>{detail.action}</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                    {detail.resource_type?.replace('_', ' ')}
                    {detail.resource_id != null && ` #${detail.resource_id}`}
                </span>
            </div>

            {/* Event */}
            <Section title="Event" icon={Activity}>
                <dl className="text-sm">
                    <Row label="When">{when}</Row>
                    <Row label="Who">{detail.user_email || 'System'}</Row>
                    {detail.user_id != null && <Row label="User ID">{detail.user_id}</Row>}
                    <Row label="Log ID">{detail.id}</Row>
                </dl>
                {detail.description && (
                    <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{detail.description}</p>
                    </div>
                )}
            </Section>

            {/* Origin — full, unmasked */}
            <Section title="Origin" icon={Globe}>
                <dl className="text-sm">
                    <Row label="IP address" mono>{detail.ip_address || '—'}</Row>
                </dl>
                <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm">
                        <Monitor className="w-4 h-4" /> Device / browser
                    </div>
                    <p className="font-mono text-xs text-gray-700 break-all rounded-xl bg-gray-50 border border-gray-100 p-3">
                        {detail.user_agent || '—'}
                    </p>
                </div>
            </Section>
        </div>
    );
}
