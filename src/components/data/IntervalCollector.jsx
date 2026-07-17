import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X, RotateCcw, Play } from 'lucide-react'

/**
 * Interval recording runner (partial/whole/momentary time sampling).
 *
 * Timing is wall-clock based: the countdown is derived from a deadline
 * timestamp, never from counting ticks. Mobile browsers suspend JS timers
 * when the screen locks or the tab is backgrounded — exactly what happens
 * mid-session while a therapist is watching the client — so a tick-counting
 * timer freezes. Here the next tick or visibility/focus event recomputes the
 * true remaining time and, if the interval already elapsed, prompts for
 * scoring immediately. (Same principle as utils/durationTimer.js.)
 *
 * While an interval is running we also request a screen Wake Lock (where
 * supported) so the device doesn't sleep mid-observation, and play a short
 * beep + vibration when the interval ends so staff can keep their eyes on
 * the client instead of the screen.
 *
 * Props:
 *  - target: { measurement_type, interval_seconds, interval_count, name }
 *  - onRecord({ result, interval_index }): persist one interval (parent posts to backend)
 *  - disabled: boolean (session paused)
 */
const TYPE_LABELS = {
    partial_interval: 'Partial Interval',
    whole_interval: 'Whole Interval',
    momentary_time_sampling: 'Momentary Time Sampling',
}

const PROMPT = {
    partial_interval: 'Did the behavior occur at ANY point during this interval?',
    whole_interval: 'Was the behavior present for the ENTIRE interval?',
    momentary_time_sampling: 'Was the behavior occurring at the END of this interval?',
}

export default function IntervalCollector({ target, onRecord, disabled = false }) {
    const intervalSeconds = target?.interval_seconds || 30
    const totalIntervals = target?.interval_count || 20

    const [currentInterval, setCurrentInterval] = useState(1)
    const [endsAt, setEndsAt] = useState(null) // epoch ms deadline of the running interval
    const [remaining, setRemaining] = useState(intervalSeconds)
    const [running, setRunning] = useState(false)
    const [awaitingScore, setAwaitingScore] = useState(false)
    const [results, setResults] = useState([]) // 'present' | 'absent'
    const pausedMsRef = useRef(null) // time left when the session was paused
    const audioRef = useRef(null)
    const wakeLockRef = useRef(null)

    // Beep + vibrate so the therapist doesn't need eyes on the screen.
    const cueIntervalEnd = useCallback(() => {
        try {
            navigator.vibrate?.([200, 100, 200])
        } catch { /* unsupported */ }
        const ctx = audioRef.current
        if (!ctx || ctx.state === 'closed') return
        try {
            if (ctx.state === 'suspended') ctx.resume()
            const beep = (at) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.frequency.value = 880
                gain.gain.setValueAtTime(0.25, at)
                osc.start(at)
                osc.stop(at + 0.18)
            }
            beep(ctx.currentTime)
            beep(ctx.currentTime + 0.3)
        } catch { /* audio unavailable */ }
    }, [])

    // Wall-clock countdown + catch-up when the page becomes visible again.
    useEffect(() => {
        if (!running || endsAt == null) return
        const check = () => {
            const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
            setRemaining(left)
            if (left <= 0) {
                setRunning(false)
                setAwaitingScore(true)
                cueIntervalEnd()
            }
        }
        check()
        const tick = setInterval(check, 500)
        const onVisible = () => {
            if (!document.hidden) check()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)
        window.addEventListener('pageshow', onVisible)
        return () => {
            clearInterval(tick)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onVisible)
            window.removeEventListener('pageshow', onVisible)
        }
    }, [running, endsAt, cueIntervalEnd])

    // Session pause: bank the time left on the current interval; re-arm on resume.
    useEffect(() => {
        if (disabled && running && endsAt != null) {
            pausedMsRef.current = Math.max(0, endsAt - Date.now())
            setRunning(false)
            setEndsAt(null)
        } else if (!disabled && pausedMsRef.current != null) {
            setEndsAt(Date.now() + pausedMsRef.current)
            pausedMsRef.current = null
            setRunning(true)
        }
    }, [disabled, running, endsAt])

    // Keep the screen awake while observing (best effort — the wall-clock
    // countdown stays correct even where Wake Lock is unsupported/denied).
    useEffect(() => {
        if (!running) return
        let cancelled = false
        const acquire = async () => {
            try {
                if (navigator.wakeLock?.request) {
                    const lock = await navigator.wakeLock.request('screen')
                    if (cancelled) lock.release()
                    else wakeLockRef.current = lock
                }
            } catch { /* denied/unsupported */ }
        }
        acquire()
        const reacquire = () => {
            if (!document.hidden) acquire()
        }
        document.addEventListener('visibilitychange', reacquire)
        return () => {
            cancelled = true
            document.removeEventListener('visibilitychange', reacquire)
            try {
                wakeLockRef.current?.release?.()
            } catch { /* already released */ }
            wakeLockRef.current = null
        }
    }, [running])

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const armInterval = () => {
        setRemaining(intervalSeconds)
        setEndsAt(Date.now() + intervalSeconds * 1000)
        setAwaitingScore(false)
        setRunning(true)
    }

    const score = (result) => {
        if (disabled) return
        onRecord({ result, interval_index: currentInterval })
        setResults(prev => [...prev, result])
        setAwaitingScore(false)
        if (currentInterval >= totalIntervals) {
            // Block complete
            setCurrentInterval(totalIntervals)
            setRunning(false)
            setEndsAt(null)
        } else {
            setCurrentInterval(n => n + 1)
            armInterval() // auto-advance to next interval
        }
    }

    const startBlock = () => {
        // Create the AudioContext inside the user gesture — iOS refuses to
        // play the end-of-interval beep from a context created elsewhere.
        if (!audioRef.current) {
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext
                if (Ctx) audioRef.current = new Ctx()
            } catch { /* no audio */ }
        }
        armInterval()
    }

    const resetBlock = () => {
        setRunning(false)
        setEndsAt(null)
        pausedMsRef.current = null
        setAwaitingScore(false)
        setCurrentInterval(1)
        setRemaining(intervalSeconds)
        setResults([])
    }

    const presentCount = results.filter(r => r === 'present').length
    const pct = results.length ? Math.round((presentCount / results.length) * 100) : 0
    const blockComplete = results.length >= totalIntervals
    const mtype = target?.measurement_type

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-1">
                {TYPE_LABELS[mtype] || 'Interval'} Recording
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">
                {intervalSeconds}s intervals · {totalIntervals} total
            </p>

            {/* Interval counter + timer */}
            <div className="text-center mb-6">
                <p className="text-gray-500 uppercase tracking-wider text-sm mb-1">
                    Interval {Math.min(currentInterval, totalIntervals)} of {totalIntervals}
                </p>
                <p className={`font-heading text-7xl font-bold font-mono ${awaitingScore ? 'text-amber-500' : running ? 'text-red-500' : 'text-[#159DB3]'}`}>
                    {formatTime(remaining)}
                </p>
                {running && <p className="text-red-400 text-sm mt-2 animate-pulse">● Observing…</p>}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-[#159DB3] transition-all"
                     style={{ width: `${(results.length / totalIntervals) * 100}%` }} />
            </div>

            {/* Controls */}
            {blockComplete ? (
                <div className="text-center">
                    <p className="text-gray-500 text-sm mb-1">Block complete</p>
                    <p className="font-heading text-4xl font-bold text-[#159DB3] mb-4">{pct}% present</p>
                    <button onClick={resetBlock}
                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2">
                        <RotateCcw size={18} /> Start New Block
                    </button>
                </div>
            ) : awaitingScore ? (
                <div>
                    <p className="text-center font-medium text-gray-700 mb-4">{PROMPT[mtype]}</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => score('present')} disabled={disabled}
                            className="bg-green-500 hover:bg-green-600 active:scale-95 text-white py-14 rounded-2xl text-2xl font-heading font-bold flex flex-col items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            <Check size={44} strokeWidth={3} /> YES
                        </button>
                        <button onClick={() => score('absent')} disabled={disabled}
                            className="bg-red-500 hover:bg-red-600 active:scale-95 text-white py-14 rounded-2xl text-2xl font-heading font-bold flex flex-col items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            <X size={44} strokeWidth={3} /> NO
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={startBlock} disabled={disabled || running}
                    className="w-full bg-[#159DB3] hover:bg-[#0E8499] text-white py-6 rounded-2xl text-xl font-heading font-bold flex items-center justify-center gap-3 shadow-lg disabled:opacity-50">
                    <Play size={24} /> {currentInterval === 1 && results.length === 0 ? 'Start Intervals' : 'Resume'}
                </button>
            )}

            {/* Running stats */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-4 flex justify-around text-center">
                <div><p className="font-heading text-2xl font-bold text-green-600">{presentCount}</p><p className="text-xs text-gray-500">Present</p></div>
                <div><p className="font-heading text-2xl font-bold text-red-500">{results.length - presentCount}</p><p className="text-xs text-gray-500">Absent</p></div>
                <div><p className="font-heading text-2xl font-bold text-[#159DB3]">{pct}%</p><p className="text-xs text-gray-500">Interval</p></div>
            </div>
        </div>
    )
}
