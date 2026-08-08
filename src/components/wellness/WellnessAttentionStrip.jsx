import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake } from 'lucide-react'
import { format } from 'date-fns'
import { toZonedDate } from '../../utils/datetime'
import { getAttention } from '../../services/wellness'

const MOOD_EMOJI = { 1: '😢', 2: '😐', 3: '🙂', 4: '😊' }
const SUPPORT_LABEL = {
    break: 'a break',
    quiet_space: 'a quiet space',
    someone_nearby: 'someone nearby',
    not_sure: 'not sure what helps',
}

/**
 * "Needs support" strip for the dashboard: recent flagged wellness
 * check-ins for clients this user works with. This is how the rest of the
 * care team sees a flagged check-in recorded on a colleague's device.
 * Renders nothing when there is nothing to show.
 */
export default function WellnessAttentionStrip() {
    const navigate = useNavigate()
    const [rows, setRows] = useState([])

    useEffect(() => {
        let cancelled = false
        getAttention()
            .then((data) => { if (!cancelled) setRows(data || []) })
            .catch(() => { /* strip is best-effort; dashboard must not break */ })
        return () => { cancelled = true }
    }, [])

    if (rows.length === 0) return null

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h3 className="font-heading font-bold text-amber-900 mb-3 flex items-center gap-2">
                <HeartHandshake size={18} />
                Wellness: needs support
            </h3>
            <div className="space-y-2">
                {rows.slice(0, 5).map(r => (
                    <button key={r.id}
                        onClick={() => navigate(`/clients/${r.client_id}`)}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{MOOD_EMOJI[r.mood_score]}</span>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{r.client_name}</p>
                                <p className="text-xs text-gray-500">
                                    {format(toZonedDate(r.created_at), 'MMM d · h:mm a')}
                                    {r.support_requested && ` · asked for ${SUPPORT_LABEL[r.support_requested] || r.support_requested}`}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-amber-700">View →</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
