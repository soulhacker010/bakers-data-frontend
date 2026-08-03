import { useState, useEffect, useRef, useCallback } from 'react'
import { getStatementsForMood, recordCheckin } from '../../services/wellness'

/**
 * Child-facing wellness check-in flow (per the client's wireframes).
 *
 * Runs fullscreen on a logged-in staff device that is handed to the child:
 * landing -> mood (1-4) -> one mood-routed statement (skipped gracefully if
 * the band has none) -> support question only when the child is struggling
 * -> encouraging finish. ONE recordCheckin POST at completion.
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

const MOODS = [
    { score: 1, label: 'distressed', emoji: '😢' },
    { score: 2, label: 'struggling', emoji: '😐' },
    { score: 3, label: 'okay', emoji: '🙂' },
    { score: 4, label: 'positive', emoji: '😊' },
]

const SUPPORTS = [
    { key: 'break', label: 'A break', emoji: '🧸' },
    { key: 'quiet_space', label: 'A quiet space', emoji: '🌈' },
    { key: 'someone_nearby', label: 'Someone nearby', emoji: '👥' },
    { key: 'not_sure', label: "I'm not sure", emoji: '❓' },
]

export default function WellnessCheckInFlow({ clientId, sessionId = null, onDone }) {
    const [step, setStep] = useState('landing') // landing|mood|statement|support|saving|done|error
    const [moodScore, setMoodScore] = useState(null)
    const [statement, setStatement] = useState(null)
    const [statementResponse, setStatementResponse] = useState(null)
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

    const submit = useCallback(async (support) => {
        if (busyRef.current) return
        busyRef.current = true
        setStep('saving')
        const payload = {
            client_id: clientId,
            session_id: sessionId,
            mood_score: moodScore,
            statement_id: statement?.id ?? null,
            statement_response: statementResponse,
            support_requested: support,
        }
        try {
            const saved = await recordCheckin(payload)
            setStep('done')
            // Give the child a moment with the star, then hand back to staff.
            setTimeout(() => onDoneRef.current?.({
                clinicalFlag: saved.clinical_flag,
                supportRequested: support,
                moodScore,
            }), 2500)
        } catch {
            // One silent retry, then surface a staff-facing error state.
            try {
                const saved = await recordCheckin(payload)
                setStep('done')
                setTimeout(() => onDoneRef.current?.({
                    clinicalFlag: saved.clinical_flag,
                    supportRequested: support,
                    moodScore,
                }), 2500)
            } catch {
                setStep('error')
            }
        } finally {
            busyRef.current = false
        }
    }, [clientId, sessionId, moodScore, statement, statementResponse])

    // Mood chosen: fetch the band's statements; none -> decide next step directly.
    const chooseMood = useCallback(async (score) => {
        if (busyRef.current) return
        busyRef.current = true
        touch()
        setMoodScore(score)
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
        } else if (score <= 2) {
            setStep('support')
        } else {
            await submitDirect(score)
        }
    }, [touch]) // eslint-disable-line react-hooks/exhaustive-deps

    // Mood-only completion path (no statement screen shown).
    const submitDirect = async (score) => {
        if (busyRef.current) return
        busyRef.current = true
        setStep('saving')
        const payload = {
            client_id: clientId,
            session_id: sessionId,
            mood_score: score,
            statement_id: null,
            statement_response: null,
            support_requested: null,
        }
        try {
            const saved = await recordCheckin(payload)
            setStep('done')
            setTimeout(() => onDoneRef.current?.({
                clinicalFlag: saved.clinical_flag, supportRequested: null, moodScore: score,
            }), 2500)
        } catch {
            setStep('error')
        } finally {
            busyRef.current = false
        }
    }

    const answerStatement = (response) => {
        touch()
        setStatementResponse(response)
        if (moodScore <= 2 || response === 'not_right_now') {
            setStep('support')
        } else {
            submitWithResponse(response)
        }
    }

    // Submit when the statement answer ends the flow (needs the fresh response
    // value - state hasn't committed yet).
    const submitWithResponse = async (response) => {
        if (busyRef.current) return
        busyRef.current = true
        setStep('saving')
        const payload = {
            client_id: clientId,
            session_id: sessionId,
            mood_score: moodScore,
            statement_id: statement?.id ?? null,
            statement_response: response,
            support_requested: null,
        }
        try {
            const saved = await recordCheckin(payload)
            setStep('done')
            setTimeout(() => onDoneRef.current?.({
                clinicalFlag: saved.clinical_flag, supportRequested: null, moodScore,
            }), 2500)
        } catch {
            setStep('error')
        } finally {
            busyRef.current = false
        }
    }

    const answerSupport = (key) => {
        touch()
        submit(key)
    }

    const big = 'w-full rounded-3xl font-heading font-bold shadow-lg active:scale-95 transition-all'

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#159DB3] to-[#214B9D] flex items-center justify-center p-6"
             onPointerDown={touch}>
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">

                {step === 'landing' && (
                    <div>
                        <p className="text-7xl mb-6">👋</p>
                        <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">Hi friend!</h1>
                        <p className="text-xl text-gray-500 mb-10">How are you feeling today?</p>
                        <button onClick={() => { touch(); setStep('mood') }}
                            className={`${big} bg-[#159DB3] hover:bg-[#0E8499] text-white py-7 text-2xl`}>
                            START
                        </button>
                    </div>
                )}

                {step === 'mood' && (
                    <div>
                        <h2 className="font-heading text-3xl font-bold text-gray-900 mb-10">
                            How do you feel right now?
                        </h2>
                        <div className="grid grid-cols-2 gap-5">
                            {MOODS.map(m => (
                                <button key={m.score} aria-label={m.label}
                                    onClick={() => chooseMood(m.score)}
                                    className="bg-gray-50 hover:bg-[#E0F4F7] border-2 border-transparent hover:border-[#159DB3] rounded-3xl py-10 text-7xl active:scale-95 transition-all">
                                    {m.emoji}
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
                                <span className="text-5xl">👍</span> YES
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
                        <div className="flex flex-col gap-4">
                            {SUPPORTS.map(s => (
                                <button key={s.key} onClick={() => answerSupport(s.key)}
                                    className={`${big} bg-gray-50 hover:bg-[#E0F4F7] border-2 border-transparent hover:border-[#159DB3] text-gray-800 py-6 text-2xl flex items-center justify-center gap-4`}>
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
                        <p className="text-2xl text-gray-500">You did great! ⭐</p>
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
