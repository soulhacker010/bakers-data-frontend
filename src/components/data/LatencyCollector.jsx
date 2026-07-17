import { useState, useEffect, useRef } from 'react'
import { Play, Square, RotateCcw } from 'lucide-react'
import { loadRun, saveRun, clearRun } from '../../utils/collectorRunStore'

/**
 * Latency recording: time from cue/SD to behavior onset.
 *
 * Elapsed time is derived from the cue's wall-clock timestamp, never from
 * counting ticks, so a locked screen or throttled tab can't shrink the
 * recorded latency — the display catches up on the next tick or
 * visibility/focus event, and the recorded value is computed from the
 * timestamps at the moment the behavior begins.
 *
 * Props:
 *  - onRecord({ duration_seconds }): persist one latency observation
 *  - disabled: boolean (session paused)
 *  - persistKey: identifies this collector's run (target id) so an
 *    in-progress observation survives switching program/target and back
 */
export default function LatencyCollector({ onRecord, disabled = false, persistKey = null }) {
    const runKey = persistKey != null ? `latency:${persistKey}` : null

    // Hydrate a run that was in progress when this collector last unmounted.
    const savedRef = useRef()
    if (savedRef.current === undefined) savedRef.current = loadRun(runKey)
    const saved = savedRef.current

    const [cueAt, setCueAt] = useState(saved?.cueAt ?? null) // epoch ms when the cue was presented
    const [elapsed, setElapsed] = useState(() => (
        saved?.cueAt != null ? Math.max(0, Math.floor((Date.now() - saved.cueAt) / 1000)) : 0
    ))
    const [lastRecorded, setLastRecorded] = useState(saved?.lastRecorded ?? null)
    const pausedMsRef = useRef(saved?.pausedMs ?? null) // elapsed ms banked while the session is paused

    const running = cueAt != null

    // Persist the run so it survives program switches and reloads.
    useEffect(() => {
        if (!runKey) return
        saveRun(runKey, { cueAt, lastRecorded, pausedMs: pausedMsRef.current })
    }, [runKey, cueAt, lastRecorded, disabled])

    // Wall-clock elapsed + catch-up when the page becomes visible again.
    useEffect(() => {
        if (cueAt == null) return
        const check = () => setElapsed(Math.max(0, Math.floor((Date.now() - cueAt) / 1000)))
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
    }, [cueAt])

    // Session pause: bank the elapsed time; re-anchor the cue on resume.
    useEffect(() => {
        if (disabled && cueAt != null) {
            pausedMsRef.current = Math.max(0, Date.now() - cueAt)
            setCueAt(null)
        } else if (!disabled && pausedMsRef.current != null) {
            setCueAt(Date.now() - pausedMsRef.current)
            pausedMsRef.current = null
        }
    }, [disabled, cueAt])

    const format = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const presentCue = () => {
        setLastRecorded(null)
        setElapsed(0)
        setCueAt(Date.now())
    }

    const behaviorStarted = () => {
        if (cueAt == null) return
        // Compute from timestamps at the moment of the tap — not the display.
        const seconds = Math.max(0, Math.floor((Date.now() - cueAt) / 1000))
        setCueAt(null)
        onRecord({ duration_seconds: seconds })
        setLastRecorded(seconds)
        setElapsed(seconds)
    }

    const reset = () => {
        clearRun(runKey)
        setCueAt(null)
        pausedMsRef.current = null
        setElapsed(0)
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-1">Latency Recording</h2>
            <p className="text-center text-sm text-gray-500 mb-6">Time from the cue until the behavior begins</p>

            <div className="text-center mb-8 py-6">
                <p className={`font-heading text-8xl font-bold font-mono ${running ? 'text-red-500 animate-pulse' : 'text-[#159DB3]'}`}>
                    {format(elapsed)}
                </p>
                {running && <p className="text-red-400 text-sm mt-3 animate-pulse">● Waiting for behavior onset…</p>}
                {!running && lastRecorded !== null && (
                    <p className="text-green-600 text-sm mt-3">✓ Recorded latency: {lastRecorded}s</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <button onClick={presentCue} disabled={disabled || running}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-10 rounded-2xl text-xl font-heading font-bold flex items-center justify-center gap-3 shadow-lg">
                    <Play size={26} /> Present Cue
                </button>
                <button onClick={behaviorStarted} disabled={disabled || !running}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-10 rounded-2xl text-xl font-heading font-bold flex items-center justify-center gap-3 shadow-lg">
                    <Square size={26} /> Behavior Began
                </button>
            </div>

            <button onClick={reset} disabled={!running}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-semibold hover:bg-gray-200 flex items-center justify-center gap-2 disabled:opacity-50">
                <RotateCcw size={18} /> Reset
            </button>
        </div>
    )
}
