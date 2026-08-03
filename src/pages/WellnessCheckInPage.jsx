import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import WellnessCheckInFlow from '../components/wellness/WellnessCheckInFlow'
import { useToast } from '../context/ToastContext'
import { useNotifications, NOTIFICATION_TYPES } from '../context/NotificationContext'

/**
 * Fullscreen wrapper for the child-facing check-in. Deliberately rendered
 * WITHOUT DashboardLayout: while the child holds the device there is no
 * navigation, no client list, no PHI - only the flow.
 *
 * Launched from a session (?session=ID) or from the client profile; returns
 * to wherever it came from and alerts the clinician when the check-in was
 * flagged (low mood / support requested).
 */
export default function WellnessCheckInPage() {
    const { clientId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { addNotification } = useNotifications()

    const sessionId = searchParams.get('session') ? parseInt(searchParams.get('session')) : null

    const handleDone = (result) => {
        if (result?.clinicalFlag) {
            const supportText = result.supportRequested
                ? ` and asked for: ${result.supportRequested.replace(/_/g, ' ')}`
                : ''
            addNotification(
                NOTIFICATION_TYPES.WELLNESS_ALERT,
                `Wellness check-in needs attention (mood ${result.moodScore}/4${supportText})`,
                { clientId: parseInt(clientId), sessionId }
            )
            toast.warning('Check-in flagged: this client may need support before the session.')
        } else if (result && !result.abandoned) {
            toast.success('Wellness check-in recorded.')
        }
        navigate(sessionId ? `/sessions/${sessionId}/collect` : `/clients/${clientId}`)
    }

    return (
        <WellnessCheckInFlow
            clientId={parseInt(clientId)}
            sessionId={sessionId}
            onDone={handleDone}
        />
    )
}
