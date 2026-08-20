import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X, RotateCcw, Play } from 'lucide-react'
import { loadRun, saveRun, clearRun } from '../../utils/collectorRunStore'
import {
    createRun,
    scoreTarget,
    pendingTargets,
    isComplete,
} from '../../utils/intervalRun'

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
 * SEVERAL BEHAVIOURS, ONE CLOCK (Dena, 20 Aug 2026: "can't open multiple
 * partial intervals at a time"). This used to run one timer per target. The
 * countdown is wall-clock, so starting a second behaviour and returning to the
 * first found its intervals already elapsed with nothing scored against them:
 * data went missing silently. A paper interval sheet has intervals across the
 * top and behaviours down the side, one clock for all of them, and that is what
 * this now does. Each behaviour is scored at every interval, and the interval
 * only closes once all of them are marked.
 *
 * Props:
 *  - targets: [{ id, name, measurement_type, interval_seconds, interval_count }]
 *             all sharing one interval length (see utils/intervalRun.js)
 *  - onRecord({ result, interval_index, target_id }): persist one score
 *  - disabled: boolean (session paused)
 */
const TYPE_LABELS = {
    partial_interval: 'Partial Interval',
    whole_interval: 'Whole Interval',
    momentary: 'Momentary Time Sampling',
    momentary_time_sampling: 'Momentary Time Sampling',
}

const PROMPT = {
    partial_interval: 'Did the behavior occur at ANY point during this interval?',
    whole_interval: 'Was the behavior present for the ENTIRE interval?',
    momentary: 'Was the behavior occurring at the END of this interval?',
    momentary_time_sampling: 'Was the behavior occurring at the END of this interval?',
}

export default function IntervalCollector({ targets, onRecord, disabled = false }) {
    const observed = (targets || []).filter(Boolean)
    const first = observed[0]
    const intervalSeconds = first?.interval_seconds || 30
    const totalIntervals = first?.interval_count || 20
    const multi = observed.length > 1

    // Keyed on the whole group: one run covers every behaviour being observed,
    // so it must survive this component unmounting when the sidebar switches
    // program or target mid-block.
    const runKey = observed.length
        ? `interval:${observed.map((t) => t.id).sort((a, b) => a - b).join('-')}`
        : null

    const savedRef = useRef()
    if (savedRef.current === undefined) savedRef.current = loadRun(runKey)
    const saved = savedRef.current

    // Hooks must run in the same order every render, so the "nothing to
    // observe" case is handled after them rather than by returning early.
    // createRun deliberately refuses an empty run, so the placeholder is built
    // directly: a data inconsistency leaving no observable target must not take
    // the whole collection page down with it.
    const [run, setRun] = useState(() => saved?.run ?? (
        observed.length
            ? createRun({
                targetIds: observed.map((t) => t.id),
                intervalSeconds,
                totalIntervals,
            })
            : { targetIds: [], intervalSeconds, totalIntervals, currentInterval: 1, scores: {} }
    ))
    const [endsAt, setEndsAt] = useState(saved?.endsAt ?? null) // epoch ms deadline
    const [remaining, setRemaining] = useState(() => (
        saved?.endsAt != null
            ? Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000))
            : intervalSeconds
    ))
    const [running, setRunning] = useState(saved?.running ?? false)
    const [awaitingScore, setAwaitingScore] = useState(saved?.awaitingScore ?? false)
    const pausedMsRef = useRef(saved?.pausedMs ?? null) // time left when paused
    const audioRef = useRef(null)
    const wakeLockRef = useRef(null)

    // Persist the run so it survives program switches and reloads.
    useEffect(() => {
        if (!runKey) return
        saveRun(runKey, {
            run, endsAt, running, awaitingScore,
            pausedMs: pausedMsRef.current,
        })
    }, [runKey, run, endsAt, running, awaitingScore, disabled])

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

    const waiting = pendingTargets(run)

    const score = (targetId, result) => {
        if (disabled) return

        const scoredInterval = run.currentInterval
        const next = scoreTarget(run, targetId, result)
        setRun(next)

        // One row per behaviour per interval, which is what the timeline engine
        // will later read back.
        onRecord({ result, interval_index: scoredInterval, target_id: targetId })

        if (isComplete(next)) {
            setRunning(false)
            setEndsAt(null)
            setAwaitingScore(false)
        } else if (next.currentInterval !== scoredInterval) {
            armInterval() // every behaviour marked, on to the next interval
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
        clearRun(runKey)
        setRunning(false)
        setEndsAt(null)
        pausedMsRef.current = null
        setAwaitingScore(false)
        setRun(createRun({
            targetIds: observed.map((t) => t.id),
            intervalSeconds,
            totalIntervals,
        }))
        setRemaining(intervalSeconds)
    }

    if (!observed.length) return null

    // Stats across every behaviour in the run.
    const allScores = Object.values(run.scores || {}).flatMap((byTarget) => Object.values(byTarget))
    const presentCount = allScores.filter((r) => r === 'present').length
    const pct = allScores.length ? Math.round((presentCount / allScores.length) * 100) : 0
    const closedIntervals = Object.values(run.scores || {})
        .filter((byTarget) => run.targetIds.every((id) => byTarget[id] != null)).length
    const blockComplete = isComplete(run)
    const started = allScores.length > 0

    /** Percent present for one behaviour, shown per row when several are observed. */
    const pctFor = (targetId) => {
        const marks = Object.values(run.scores || {})
            .map((byTarget) => byTarget[targetId])
            .filter(Boolean)
        if (!marks.length) return null
        return Math.round((marks.filter((r) => r === 'present').length / marks.length) * 100)
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-1">
                {multi ? 'Interval Recording' : (TYPE_LABELS[first?.measurement_type] || 'Interval')}
                {!multi && ' Recording'}
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">
                {intervalSeconds}s intervals · {totalIntervals} total
                {multi && ` · ${observed.length} behaviors`}
            </p>

            {/* Interval counter + timer */}
            <div className="text-center mb-6">
                <p className="text-gray-500 uppercase tracking-wider text-sm mb-1">
                    Interval {Math.min(run.currentInterval, totalIntervals)} of {totalIntervals}
                </p>
                <p className={`font-heading text-7xl font-bold font-mono ${awaitingScore ? 'text-amber-500' : running ? 'text-red-500' : 'text-[#159DB3]'}`}>
                    {formatTime(remaining)}
                </p>
                {running && <p className="text-red-400 text-sm mt-2 animate-pulse">● Observing…</p>}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-[#159DB3] transition-all"
                     style={{ width: `${(closedIntervals / totalIntervals) * 100}%` }} />
            </div>

            {/* Controls */}
            {blockComplete ? (
                <div className="text-center">
                    <p className="text-gray-500 text-sm mb-1">Block complete</p>
                    <p className="font-heading text-4xl font-bold text-[#159DB3] mb-4">{pct}% present</p>
                    {multi && (
                        <div className="mb-4 space-y-1">
                            {observed.map((t) => (
                                <p key={t.id} className="text-sm text-gray-600">
                                    {t.name}: <b>{pctFor(t.id)}%</b>
                                </p>
                            ))}
                        </div>
                    )}
                    <button onClick={resetBlock}
                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2">
                        <RotateCcw size={18} /> Start New Block
                    </button>
                </div>
            ) : awaitingScore ? (
                multi ? (
                    /* One row per behaviour. The interval stays open until every
                       row is marked, so nothing is scored by omission. */
                    <div className="space-y-3">
                        <p className="text-center font-medium text-gray-700 mb-1">
                            Mark each behavior for this interval
                        </p>
                        <p className="text-center text-xs text-gray-400 mb-3">
                            {waiting.length} of {observed.length} still to mark
                        </p>
                        {observed.map((t) => {
                            const marked = run.scores?.[run.currentInterval]?.[t.id]
                            return (
                                <div key={t.id}
                                     className={`rounded-2xl border p-3 ${marked ? 'border-gray-100 bg-gray-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{t.name}</p>
                                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                            {TYPE_LABELS[t.measurement_type] || 'Interval'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => score(t.id, 'present')}
                                            disabled={disabled}
                                            aria-pressed={marked === 'present'}
                                            aria-label={`${t.name} yes`}
                                            className={`py-5 rounded-xl font-heading font-bold flex items-center justify-center gap-2 shadow disabled:opacity-50 ${marked === 'present'
                                                ? 'bg-green-600 text-white ring-2 ring-green-300'
                                                : 'bg-green-500 hover:bg-green-600 active:scale-95 text-white'}`}
                                        >
                                            <Check size={22} strokeWidth={3} /> YES
                                        </button>
                                        <button
                                            onClick={() => score(t.id, 'absent')}
                                            disabled={disabled}
                                            aria-pressed={marked === 'absent'}
                                            aria-label={`${t.name} no`}
                                            className={`py-5 rounded-xl font-heading font-bold flex items-center justify-center gap-2 shadow disabled:opacity-50 ${marked === 'absent'
                                                ? 'bg-red-600 text-white ring-2 ring-red-300'
                                                : 'bg-red-500 hover:bg-red-600 active:scale-95 text-white'}`}
                                        >
                                            <X size={22} strokeWidth={3} /> NO
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div>
                        <p className="text-center font-medium text-gray-700 mb-4">
                            {PROMPT[first?.measurement_type]}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => score(first.id, 'present')} disabled={disabled}
                                aria-label={`${first?.name} yes`}
                                className="bg-green-500 hover:bg-green-600 active:scale-95 text-white py-14 rounded-2xl text-2xl font-heading font-bold flex flex-col items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                <Check size={44} strokeWidth={3} /> YES
                            </button>
                            <button onClick={() => score(first.id, 'absent')} disabled={disabled}
                                aria-label={`${first?.name} no`}
                                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white py-14 rounded-2xl text-2xl font-heading font-bold flex flex-col items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                <X size={44} strokeWidth={3} /> NO
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <button onClick={startBlock} disabled={disabled || running}
                    className="w-full bg-[#159DB3] hover:bg-[#0E8499] text-white py-6 rounded-2xl text-xl font-heading font-bold flex items-center justify-center gap-3 shadow-lg disabled:opacity-50">
                    <Play size={24} /> {!started ? 'Start Intervals' : 'Resume'}
                </button>
            )}

            {/* Running stats */}
            <div className="mt-6 bg-gray-50 rounded-2xl p-4 flex justify-around text-center">
                <div><p className="font-heading text-2xl font-bold text-green-600">{presentCount}</p><p className="text-xs text-gray-500">Present</p></div>
                <div><p className="font-heading text-2xl font-bold text-red-500">{allScores.length - presentCount}</p><p className="text-xs text-gray-500">Absent</p></div>
                <div><p className="font-heading text-2xl font-bold text-[#159DB3]">{pct}%</p><p className="text-xs text-gray-500">Interval</p></div>
            </div>
        </div>
    )
}
