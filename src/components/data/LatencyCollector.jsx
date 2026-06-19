import { useState, useEffect, useRef } from 'react'
import { Play, Square, RotateCcw } from 'lucide-react'

/**
 * Latency recording: time from cue/SD to behavior onset.
 *
 * Props:
 *  - onRecord({ duration_seconds }): persist one latency observation
 *  - disabled: boolean
 */
export default function LatencyCollector({ onRecord, disabled = false }) {
    const [elapsed, setElapsed] = useState(0)
    const [running, setRunning] = useState(false)
    const [lastRecorded, setLastRecorded] = useState(null)
    const tickRef = useRef(null)

    useEffect(() => {
        if (!running || disabled) return
        tickRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(tickRef.current)
    }, [running, disabled])

    const format = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const presentCue = () => { setElapsed(0); setRunning(true) }
    const behaviorStarted = () => {
        setRunning(false)
        onRecord({ duration_seconds: elapsed })
        setLastRecorded(elapsed)
    }
    const reset = () => { setRunning(false); setElapsed(0) }

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
