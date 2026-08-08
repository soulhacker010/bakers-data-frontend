import { useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedDate } from '../../utils/datetime'
import { getSessionWellness } from '../../services/wellness'

const MOOD_EMOJI = { 1: '😢', 2: '😐', 3: '🙂', 4: '😊' }
// The client's own mood vocabulary (prompt-library document).
const MOOD_LABEL = { 1: 'Having a hard time', 2: 'Not sure', 3: 'Doing okay', 4: 'Feeling good' }
const SUPPORT_LABEL = {
    break: 'A break',
    quiet_space: 'A quiet space',
    someone_nearby: 'Someone nearby',
    not_sure: 'Not sure',
}

/**
 * "Before session" strip on the session detail page: the wellness check-ins
 * recorded during this session. Renders nothing when there are none.
 */
export default function SessionWellnessStrip({ sessionId }) {
    const [checkins, setCheckins] = useState([])

    useEffect(() => {
        let cancelled = false
        getSessionWellness(sessionId)
            .then((data) => { if (!cancelled) setCheckins(data || []) })
            .catch(() => { /* best-effort strip; page must not break */ })
        return () => { cancelled = true }
    }, [sessionId])

    if (checkins.length === 0) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smile size={18} className="text-[#159DB3]" />
                Wellness Check-In
            </h3>
            <div className="space-y-2">
                {checkins.map(c => (
                    <div key={c.id}
                         className={`flex items-center justify-between p-3 rounded-xl border ${c.clinical_flag ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-transparent'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{MOOD_EMOJI[c.mood_score]}</span>
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {MOOD_LABEL[c.mood_score]}
                                    {c.statement_text && (
                                        <span className="text-gray-500 font-normal">
                                            {' '}· "{c.statement_text}" — {c.statement_response === 'yes' ? 'Yes' : 'Not right now'}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">{format(toZonedDate(c.created_at), 'h:mm a')}</p>
                            </div>
                        </div>
                        {c.support_requested && (
                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                {SUPPORT_LABEL[c.support_requested]}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
