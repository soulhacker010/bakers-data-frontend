// Small shared building blocks for the admin detail drawers (program / therapist
// / client). Keeps the panels visually consistent in one place.

export function StatTile({ label, value, hint }) {
    return (
        <div className="flex-1 rounded-2xl bg-white border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="font-heading text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
    );
}

export function Section({ title, icon: Icon, children }) {
    return (
        <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon className="w-4 h-4 text-[#159DB3]" />}
                <h3 className="font-heading font-bold text-gray-900 text-sm">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');

export const fmtDuration = (mins) =>
    (typeof mins === 'number' ? `${mins} min` : '—');
