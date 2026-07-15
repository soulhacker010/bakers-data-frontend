// Shared badge styles for program + target attributes.
// Used by both the admin dashboard list and the program detail drawer so the
// colours stay consistent in one place.

const TYPE_STYLES = {
    behavior: 'bg-red-50 text-red-700',
    skill: 'bg-purple-50 text-purple-700',
};

// Program lifecycle status (active / maintenance / mastered / archived).
const STATUS_STYLES = {
    active: 'bg-green-50 text-green-700',
    maintenance: 'bg-blue-50 text-blue-700',
    mastered: 'bg-emerald-50 text-emerald-700',
    archived: 'bg-gray-100 text-gray-500',
    'on-hold': 'bg-amber-50 text-amber-700',
};

const DATA_TYPE_LABELS = {
    trial: 'Trial',
    frequency: 'Frequency',
    duration: 'Duration',
    task_analysis: 'Task Analysis',
};

export function ProgramTypeBadge({ type }) {
    if (!type) return null;
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${TYPE_STYLES[type] || 'bg-gray-100 text-gray-700'}`}>
            {type}
        </span>
    );
}

export function ProgramStatusBadge({ status }) {
    if (!status) return null;
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

export function DataTypeBadge({ dataType }) {
    if (!dataType) return null;
    return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
            {DATA_TYPE_LABELS[dataType] || dataType}
        </span>
    );
}
