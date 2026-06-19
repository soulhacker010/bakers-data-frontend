import { useState, useEffect, useRef } from 'react'
import { Check, X, RotateCcw, Play } from 'lucide-react'

/**
 * Interval recording runner (partial/whole/momentary time sampling).
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
    const [remaining, setRemaining] = useState(intervalSeconds)
    const [running, setRunning] = useState(false)
    const [awaitingScore, setAwaitingScore] = useState(false)
    const [results, setResults] = useState([]) // 'present' | 'absent'
    const tickRef = useRef(null)

    // Countdown
    useEffect(() => {
        if (!running || disabled) return
        tickRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    setRunning(false)
                    setAwaitingScore(true)
                    return 0
                }
                return r - 1
            })
        }, 1000)
        return () => clearInterval(tickRef.current)
    }, [running, disabled])

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
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
        } else {
            setCurrentInterval(n => n + 1)
            setRemaining(intervalSeconds)
            setRunning(true) // auto-advance to next interval
        }
    }

    const startBlock = () => {
        setRemaining(intervalSeconds)
        setRunning(true)
        setAwaitingScore(false)
    }

    const resetBlock = () => {
        setRunning(false)
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
