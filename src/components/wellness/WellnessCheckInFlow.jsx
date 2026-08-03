import { useState, useEffect, useRef, useCallback } from 'react'
import { getStatementsForMood, getSupportOptions, recordCheckin } from '../../services/wellness'

/**
 * Child-facing wellness check-in flow (per the client's Complete Patient
 * Prompt Library document).
 *
 * Runs fullscreen on a logged-in staff device that is handed to the child:
 * welcome -> mood (labeled, color-coded, numbers never shown) -> one
 * statement routed by the client's mood-to-category table -> support
 * question ONLY when mood is low AND the answer was "Not right now" (the
 * document's rule) -> encouraging finish. ONE recordCheckin POST at
 * completion. Support options are fetched (data-driven) so locations can
 * hide choices they don't offer.
 *
 * Child screens show zero PHI - no name, no client data, just the flow.
 *
 * The inactivity timeout is wall-clock (deadline timestamp + visibility
 * catch-up, never tick counting) so a locked or throttled tablet can't
 * strand the screen: if the device sits untouched past the deadline the
 * flow abandons cleanly and returns to the staff view with nothing saved.
 *
 * Props:
 *  - clientId, sessionId (nullable)
 *  - onDone({ abandoned?, clinicalFlag?, supportRequested?, moodScore? })
 */

const INACTIVITY_MS = 2 * 60 * 1000
const DONE_DELAY_MS = 4000 // brief star moment, then hand back to staff

// Labels + button colors per the client's document; scores stored, never shown.
const MOODS = [
    { score: 1, label: 'Having a hard time', aria: 'having a hard time', emoji: '😢', tone: 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-400' },
    { score: 2, label: 'Not sure', aria: 'not sure', emoji: '😐', tone: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-400' },
    { score: 3, label: 'Doing okay', aria: 'doing okay', emoji: '🙂', tone: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-400' },
    { score: 4, label: 'Feeling good', aria: 'feeling good', emoji: '😊', tone: 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-400' },
]

export default function WellnessCheckInFlow({ clientId, sessionId = null, onDone }) {
    const [step, setStep] = useState('landing') // landing|mood|statement|support|saving|done|error
    const [moodScore, setMoodScore] = useState(null)
    const [statement, setStatement] = useState(null)
    const [supportOptions, setSupportOptions] = useState([])
    const [deadline, setDeadline] = useState(() => Date.now() + INACTIVITY_MS)
    const busyRef = useRef(false)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    const touch = useCallback(() => setDeadline(Date.now() + INACTIVITY_MS), [])

    // Wall-clock inactivity watchdog with visibility catch-up.
    useEffect(() => {
        if (step === 'done' || step === 'saving') return
        const check = () => {
            if (Date.now() >= deadline) onDoneRef.current?.({ abandoned: true })
        }
        const tick = setInterval(check, 1000)
        const onVisible = () => {
            if (!document.hidden) check()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)
        return () => {
            clearInterval(tick)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onVisible)
        }
    }, [deadline, step])

    const save = async (score, stmt, response, support) => {
        if (busyRef.current) return
        busyRef.current = true
        setStep('saving')
        const payload = {
            client_id: clientId,
            session_id: sessionId,
            mood_score: score,
            statement_id: stmt?.id ?? null,
            statement_response: response,
            support_requested: support,
        }
        let saved = null
        try {
            saved = await recordCheckin(payload)
        } catch {
            try {
                saved = await recordCheckin(payload) // one silent retry
            } catch {
                busyRef.current = false
                setStep('error')
                return
            }
        }
        busyRef.current = false
        setStep('done')
        setTimeout(() => onDoneRef.current?.({
            clinicalFlag: saved.clinical_flag,
            supportRequested: support,
            moodScore: score,
        }), DONE_DELAY_MS)
    }

    // Mood chosen: fetch the routed statements (and prefetch support options
    // in the background); no statements -> mood-only check-in completes.
    const chooseMood = useCallback(async (score) => {
        if (busyRef.current) return
        busyRef.current = true
        touch()
        setMoodScore(score)
        getSupportOptions()
            .then(opts => setSupportOptions(opts || []))
            .catch(() => setSupportOptions([]))
        let statements = []
        try {
            statements = await getStatementsForMood(score)
        } catch { /* treated as empty - flow continues mood-only */ }
        busyRef.current = false
        if (statements.length > 0) {
            // Rotate by day so the child doesn't see the same statement every visit.
            const pick = statements[new Date().getDate() % statements.length]
            setStatement(pick)
            setStep('statement')
        } else {
            await save(score, null, null, null)
        }
    }, [touch]) // eslint-disable-line react-hooks/exhaustive-deps

    // The statement response is needed after the support screen, so it is
    // held until the support answer submits the full picture.
    const [pendingResponse, setPendingResponse] = useState(null)

    const answerStatement = (response) => {
        touch()
        // The document's rule: follow-up ONLY when mood is low AND the child
        // answered "Not right now".
        if (moodScore <= 2 && response === 'not_right_now' && supportOptions.length > 0) {
            setPendingResponse(response)
            setStep('support')
        } else {
            save(moodScore, statement, response, null)
        }
    }

    const answerSupport = (key) => {
        touch()
        save(moodScore, statement, pendingResponse, key)
    }

    const big = 'w-full rounded-3xl font-heading font-bold shadow-lg active:scale-95 transition-all'

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#159DB3] to-[#214B9D] flex items-center justify-center p-6"
             onPointerDown={touch}>
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">

                {step === 'landing' && (
                    <div>
                        <p className="text-7xl mb-6">👋</p>
                        <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">Hi there!</h1>
                        <p className="text-xl text-gray-500 mb-10">We'd like to know how you're feeling today.</p>
                        <button onClick={() => { touch(); setStep('mood') }}
                            className={`${big} bg-[#159DB3] hover:bg-[#0E8499] text-white py-7 text-2xl`}>
                            Start
                        </button>
                    </div>
                )}

                {step === 'mood' && (
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-10">
                            How are you feeling right now?
                        </h2>
                        <div className="grid grid-cols-2 gap-5">
                            {MOODS.map(m => (
                                <button key={m.score} aria-label={m.aria}
                                    onClick={() => chooseMood(m.score)}
                                    className={`${m.tone} border-2 rounded-3xl py-8 px-4 active:scale-95 transition-all flex flex-col items-center gap-3`}>
                                    <span className="text-6xl">{m.emoji}</span>
                                    <span className="font-heading font-bold text-gray-800 text-lg">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'statement' && statement && (
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-10">
                            {statement.text}
                        </h2>
                        <div className="grid grid-cols-2 gap-5">
                            <button onClick={() => answerStatement('yes')}
                                className={`${big} bg-green-500 hover:bg-green-600 text-white py-12 text-3xl flex flex-col items-center gap-2`}>
                                <span className="text-5xl">👍</span> Yes
                            </button>
                            <button onClick={() => answerStatement('not_right_now')}
                                className={`${big} bg-amber-400 hover:bg-amber-500 text-white py-12 text-2xl flex flex-col items-center gap-2`}>
                                <span className="text-5xl">👎</span> Not right now
                            </button>
                        </div>
                    </div>
                )}

                {step === 'support' && (
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-10">
                            What would help right now?
                        </h2>
                        <div className="flex flex-col gap-4 max-h-[26rem] overflow-y-auto">
                            {supportOptions.map(s => (
                                <button key={s.key} onClick={() => answerSupport(s.key)}
                                    className={`${big} bg-gray-50 hover:bg-[#E0F4F7] border-2 border-transparent hover:border-[#159DB3] text-gray-800 py-5 text-xl flex items-center justify-center gap-4`}>
                                    <span className="text-4xl">{s.emoji}</span> {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(step === 'saving' || step === 'done') && (
                    <div>
                        <p className="text-7xl mb-6">⭐</p>
                        <h2 className="font-heading text-4xl font-bold text-gray-900 mb-3">Thank you!</h2>
                        <p className="text-2xl text-gray-500">Thanks for checking in today!</p>
                    </div>
                )}

                {step === 'error' && (
                    <div>
                        <p className="text-6xl mb-6">📶</p>
                        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-3">
                            Please hand the device back
                        </h2>
                        <p className="text-gray-500 mb-8">
                            The check-in could not be saved. Check the connection and try again.
                        </p>
                        <button onClick={() => onDoneRef.current?.({ abandoned: true })}
                            className={`${big} bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 text-lg`}>
                            Back to session
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
