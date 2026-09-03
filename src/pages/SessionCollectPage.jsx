import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getClient } from '../services/clients'
import { getProgram, getPrograms } from '../services/programs'
import { getTargets } from '../services/targets'
import { unavailableTargetsNotice } from '../utils/targetAvailability'
import { pauseSession, resumeSession } from '../services/sessions'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications, NOTIFICATION_TYPES } from '../context/NotificationContext'
import { getUserSettings } from '../services/settings'
import { Check, X, StopCircle, Plus, Minus, Play, Square, RotateCcw, ChevronLeft, ChevronRight, Target, FileText, ListChecks, Pause, CircleSlash, Timer, Smile, CheckCircle } from 'lucide-react'
import { TaskAnalysisCollector, IntervalCollector, LatencyCollector } from '../components/data'
import {
    saveActiveSession,
    clearActiveSession,
    acquireSessionLock
} from '../utils/sessionStorage'
import {
    recordWithRetry,
    processRetryQueue,
    getRetryQueueCount,
    clearRetryQueue
} from '../utils/sessionRetry'
import {
    createTimer,
    elapsedSeconds,
    start as startTimerState,
    stop as stopTimerState,
    reset as resetTimerState,
    adjust as adjustTimerState,
    hydrate as hydrateTimerState
} from '../utils/durationTimer'
import { saveTimers, loadTimers, clearTimers } from '../utils/durationTimerStore'
import { sessionElapsedSeconds, formatClock } from '../utils/sessionClock'
import {
    restoredEntries,
    restoredNotes,
    zeroRecordedProgramIds,
    findResumableSession
} from '../utils/sessionResume'
import { observableTogether } from '../utils/intervalRun'

// The session clock is derived from the server's session record (see
// utils/sessionClock.js) rather than counted here, so it survives leaving the
// page — switching programs, refreshing, or handing the tablet over for a
// wellness check-in no longer restarts it at zero.

// Trial Data Collection Component
function TrialDataCollector({ onRecord, stats, showPromptLevels = true, disabled = false }) {
    const [selectedPrompt, setSelectedPrompt] = useState(null)

    const promptLevels = [
        { key: 'independent', label: 'Ind', full: 'Independent' },
        { key: 'verbal', label: 'Ver', full: 'Verbal' },
        { key: 'gestural', label: 'Ges', full: 'Gestural' },
        { key: 'physical', label: 'Phy', full: 'Physical' },
    ]

    const handleRecord = (result) => {
        if (disabled) return
        onRecord({ result, prompt_level: selectedPrompt })
        setSelectedPrompt(null)
    }

    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-8">
                Trial-Based Recording
            </h2>

            {/* Correct/Incorrect Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => handleRecord('correct')}
                    disabled={disabled}
                    className={`bg-green-500 hover:bg-green-600 active:scale-95 text-white py-16 px-6 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Check size={48} strokeWidth={3} />
                    CORRECT
                </button>
                <button
                    onClick={() => handleRecord('incorrect')}
                    disabled={disabled}
                    className={`bg-red-500 hover:bg-red-600 active:scale-95 text-white py-16 px-6 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <X size={48} strokeWidth={3} />
                    INCORRECT
                </button>
            </div>

            {/* Prompt Level - Only show if setting enabled */}
            {showPromptLevels && (
                <div className="mb-8">
                    <p className="label-uppercase text-center mb-4">PROMPT LEVEL (OPTIONAL)</p>
                    <div className="grid grid-cols-4 gap-3">
                        {promptLevels.map((prompt) => (
                            <button
                                key={prompt.key}
                                onClick={() => setSelectedPrompt(selectedPrompt === prompt.key ? null : prompt.key)}
                                className={`py-4 px-3 rounded-xl text-sm font-semibold transition-all duration-150 border-2 ${selectedPrompt === prompt.key
                                    ? 'bg-[#E0F4F7] border-[#159DB3] text-[#159DB3]'
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                {prompt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Session Stats */}
            <div className="bg-gray-50 rounded-2xl p-6">
                <p className="label-uppercase mb-4">SESSION STATS</p>
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                        <p className="font-heading text-4xl font-bold text-green-600">{stats.correct}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Correct</p>
                    </div>
                    <div className="text-center">
                        <p className="font-heading text-4xl font-bold text-red-500">{stats.incorrect}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Incorrect</p>
                    </div>
                    <div className="text-center">
                        <p className="font-heading text-4xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total</p>
                    </div>
                </div>
                <div className="pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500 mb-1">Accuracy</p>
                    <p className="font-heading text-3xl font-bold text-[#159DB3]">{accuracy}%</p>
                </div>
            </div>
        </div>
    )
}

// Frequency Data Collection Component
function FrequencyDataCollector({ onRecord, onSubtract, onRecordZero, count, disabled = false, zeroRecorded = false }) {
    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-8">
                Frequency Counting
            </h2>

            {/* Count Display */}
            <div className="text-center mb-8 py-8">
                <p className="font-heading text-8xl font-bold text-[#159DB3]">{count}</p>
                <p className="text-gray-500 mt-2 uppercase tracking-wider text-sm">Occurrences</p>
            </div>

            {/* Record Zero Button */}
            {count === 0 && (
                <div className="mb-4">
                    <button
                        onClick={() => !disabled && onRecordZero && onRecordZero()}
                        disabled={disabled || zeroRecorded}
                        className={`w-full py-4 rounded-2xl text-lg font-heading font-bold transition-all duration-150 flex items-center justify-center gap-3 border-2 ${zeroRecorded
                                ? 'bg-green-50 border-green-300 text-green-700 cursor-default'
                                : disabled
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 hover:border-amber-500 active:scale-95 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {zeroRecorded
                            ? <><Check size={22} /> Zero Recorded for Today</>
                            : <><CircleSlash size={22} /> Record Zero — No Behaviors Occurred</>
                        }
                    </button>
                    {!zeroRecorded && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                            Use this to confirm the behavior was tracked but did not occur
                        </p>
                    )}
                </div>
            )}

            {/* Add and Subtract Buttons */}
            <div className="flex gap-4">
                {/* Subtract Button */}
                <button
                    onClick={() => !disabled && count > 0 && onSubtract && onSubtract()}
                    disabled={disabled || count === 0}
                    className={`flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white py-6 rounded-2xl text-xl font-heading font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${(disabled || count === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Minus size={28} />
                    Remove
                </button>

                {/* Add Button */}
                <button
                    onClick={() => !disabled && onRecord({ count: 1 })}
                    disabled={disabled}
                    className={`flex-1 bg-[#159DB3] hover:bg-[#0E8499] active:scale-95 text-white py-6 rounded-2xl text-xl font-heading font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Plus size={28} />
                    Add
                </button>
            </div>
        </div>
    )
}

// Duration Data Collection Component
// Now receives timer state from parent so it persists across tab switches
export function DurationDataCollector({ onRecord, onStart, onStop, onReset, onAdjust, durationSeconds, isTracking, disabled = false }) {
    const formatDuration = (secs) => {
        const mins = Math.floor(secs / 60)
        const remainingSecs = secs % 60
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
    }

    const handleStop = () => {
        onStop()
        onRecord({ duration_seconds: durationSeconds })
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-8">
                Duration Tracking
            </h2>

            {/* Timer Display */}
            <div className="text-center mb-8 py-8">
                <p className={`font-heading text-8xl font-bold font-mono tracking-tight ${isTracking ? 'text-red-500 animate-pulse' : 'text-[#159DB3]'}`}>
                    {formatDuration(durationSeconds)}
                </p>
                {isTracking && (
                    <p className="text-red-400 text-sm mt-3 font-medium uppercase tracking-wider animate-pulse">● Recording...</p>
                )}
            </div>

            {/* Manual +/- Adjustment — correct the count without stopping the timer */}
            <div className="mb-6">
                <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adjust</p>
                <div className="grid grid-cols-4 gap-2">
                    {[-5, -1, 1, 5].map((delta) => (
                        <button
                            key={delta}
                            onClick={() => onAdjust(delta)}
                            disabled={disabled}
                            className={`flex items-center justify-center gap-1 py-3 rounded-xl font-heading font-bold text-base border-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${delta < 0
                                ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                : 'border-[#159DB3]/30 text-[#159DB3] hover:bg-[#159DB3]/10'}`}
                        >
                            {delta < 0 ? <Minus size={16} /> : <Plus size={16} />}
                            {Math.abs(delta)}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Start/Stop Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={onStart}
                    disabled={isTracking || disabled}
                    className={`bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-10 rounded-2xl text-xl font-heading font-bold transition-all flex items-center justify-center gap-3 shadow-lg`}
                >
                    <Play size={28} />
                    Start
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isTracking || disabled}
                    className={`bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-10 rounded-2xl text-xl font-heading font-bold transition-all flex items-center justify-center gap-3 shadow-lg`}
                >
                    <Square size={28} />
                    Stop
                </button>
            </div>

            {/* Reset Button */}
            <button
                onClick={onReset}
                disabled={isTracking}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RotateCcw size={18} />
                Reset Timer
            </button>
        </div>
    )
}

// Floating Duration Timer Pills — shows active timers from any tab
function FloatingDurationPills({ durationTimers, programs, currentProgramId, onJumpToProgram, onStopTimer, now }) {
    const activeTimers = Array.from(durationTimers.entries()).filter(([, t]) => t.isRunning)
    if (activeTimers.length === 0) return null

    const formatDuration = (secs) => {
        const mins = Math.floor(secs / 60)
        const remainingSecs = secs % 60
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
    }

    // Don't show pill for the program currently being viewed
    const otherTimers = activeTimers.filter(([pid]) => pid !== currentProgramId)
    if (otherTimers.length === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {otherTimers.map(([programId, timer]) => {
                const prog = programs.find(p => p.id === programId)
                return (
                    <div
                        key={programId}
                        className="flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl cursor-pointer hover:bg-red-600 transition-all animate-pulse-subtle group"
                        onClick={() => onJumpToProgram(prog)}
                    >
                        <Timer size={18} className="shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-medium opacity-80 truncate max-w-[140px]">{prog?.name || 'Duration'}</p>
                            <p className="font-heading font-bold text-lg font-mono">{formatDuration(elapsedSeconds(timer, now))}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onStopTimer(programId) }}
                            className="ml-2 bg-white/20 hover:bg-white/30 rounded-lg p-1.5 transition-colors"
                            title="Stop timer"
                        >
                            <Square size={14} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

export default function SessionCollectPage() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const { addNotification } = useNotifications()
    const [notes, setNotes] = useState('')
    const [sessionData, setSessionData] = useState([])
    const [client, setClient] = useState(null)
    const [program, setProgram] = useState(null)
    const [programs, setPrograms] = useState([])
    const [targets, setTargets] = useState([])
    // Why there is nothing to collect against, when that is the case. An empty
    // sidebar reads as a broken program, which cost Dena a working day
    // (3 Sept 2026); the screen has to say what happened.
    const [targetsNotice, setTargetsNotice] = useState(null)
    const [selectedTarget, setSelectedTarget] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sessionId, setSessionId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    // The server's session record — start time plus pause bookkeeping. This is
    // the single source of truth for the session clock.
    const [session, setSession] = useState(null)

    // Duration timer state — wall-clock based so a running timer survives a
    // page close / refresh / crash and stays accurate across tab throttling.
    // Map<programId, timerState> (shape defined in utils/durationTimer.js)
    const [durationTimers, setDurationTimers] = useState(new Map())
    // Current clock, refreshed each tick so running timers re-render.
    const [now, setNow] = useState(() => Date.now())
    // Latest sessionId reachable inside callbacks without stale closures.
    const sessionIdRef = useRef(null)
    useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

    // Apply a change to the timer map and persist it in the same step.
    const updateTimers = useCallback((mutator) => {
        setDurationTimers(prev => {
            const next = mutator(new Map(prev))
            saveTimers(sessionIdRef.current, next)
            return next
        })
    }, [])

    // Restore saved timers once the session id is known.
    useEffect(() => {
        if (!sessionId) return
        const loaded = loadTimers(sessionId)
        if (loaded.size === 0) return
        const t = Date.now()
        let anyFlagged = false
        const restored = new Map()
        for (const [pid, state] of loaded) {
            const { timer: restoredTimer, flagged } = hydrateTimerState(state, t)
            restored.set(pid, restoredTimer)
            if (flagged) anyFlagged = true
        }
        // Don't clobber a timer the user may have already started this render.
        setDurationTimers(prev => (prev.size > 0 ? prev : restored))
        setNow(t)
        saveTimers(sessionId, restored)
        if (anyFlagged) {
            toast.info('A duration timer was left running for a while — please check its time before recording.')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId])

    // While any timer runs: refresh the clock (so the display advances) and
    // heartbeat lastTickAt (this is what lets us separate real run-time from
    // closed-gap time when restoring after a crash).
    useEffect(() => {
        const hasActive = Array.from(durationTimers.values()).some(t => t.isRunning)
        if (!hasActive) return

        const interval = setInterval(() => {
            const t = Date.now()
            setNow(t)
            setDurationTimers(prev => {
                let changed = false
                const next = new Map(prev)
                for (const [pid, tm] of next) {
                    if (tm.isRunning) {
                        next.set(pid, { ...tm, lastTickAt: t })
                        changed = true
                    }
                }
                if (changed) {
                    saveTimers(sessionIdRef.current, next)
                    return next
                }
                return prev
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [durationTimers])

    // Advance the displayed session clock once a second. Nothing is
    // accumulated here — the tick only re-renders so the derived value is
    // recomputed. While paused the reading is constant, so no tick is needed.
    useEffect(() => {
        if (!session || session.end_time || session.is_paused) return
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [session])

    // Session elapsed time, recomputed from the server record every render.
    const formatTime = formatClock(sessionElapsedSeconds(session, now))

    // Duration timer helpers
    const startDurationTimer = useCallback((programId) => {
        updateTimers(next => {
            const existing = next.get(programId) || createTimer()
            next.set(programId, startTimerState(existing, Date.now()))
            return next
        })
        setNow(Date.now())
    }, [updateTimers])

    const stopDurationTimer = useCallback((programId) => {
        updateTimers(next => {
            const existing = next.get(programId)
            if (existing) next.set(programId, stopTimerState(existing, Date.now()))
            return next
        })
    }, [updateTimers])

    const resetDurationTimer = useCallback((programId) => {
        updateTimers(next => {
            next.set(programId, resetTimerState())
            return next
        })
    }, [updateTimers])

    const adjustDurationTimer = useCallback((programId, deltaSeconds) => {
        updateTimers(next => {
            const existing = next.get(programId) || createTimer()
            next.set(programId, adjustTimerState(existing, deltaSeconds, Date.now()))
            return next
        })
        setNow(Date.now())
    }, [updateTimers])

    // Stop a timer from the floating pill and record the data
    const stopAndRecordDurationTimer = useCallback(async (programId) => {
        const timerState = durationTimers.get(programId)
        if (!timerState || !sessionId) return

        const seconds = elapsedSeconds(timerState, Date.now())
        stopDurationTimer(programId)

        const dataPoint = {
            program_id: programId,
            data_type: 'duration',
            duration_seconds: seconds,
            target_id: null
        }
        const localEntry = {
            id: Date.now(),
            ...dataPoint,
            timestamp: new Date().toISOString()
        }
        setSessionData(prev => [...prev, localEntry])

        try {
            const { recordSessionData } = await import('../services/sessions')
            await recordWithRetry(recordSessionData, sessionId, dataPoint)
        } catch (err) {
            console.error('Failed to record duration from pill:', err)
        }
    }, [durationTimers, sessionId, stopDurationTimer])

    const [userSettings, setUserSettings] = useState({
        show_prompt_levels: true,
        auto_save_interval: 30,
        default_mastery_criteria: 80
    })
    const [lastAutoSave, setLastAutoSave] = useState(null)

    // Get client and program from params
    const clientId = searchParams.get('client') || 1
    const programId = searchParams.get('program') || 1
    const sessionDate = searchParams.get('session_date') || null  // For backdating

    // Ref to prevent multiple session starts
    const hasInitialized = useRef(false)

    // Fetch client and program data, then start or continue session
    useEffect(() => {
        // Prevent running multiple times
        if (hasInitialized.current) return
        hasInitialized.current = true

        const initSession = async () => {
            try {
                setLoading(true)

                // Check if we're continuing an existing session
                if (id) {
                    // Load existing session
                    const { getSession } = await import('../services/sessions')
                    const existingSession = await getSession(id)

                    // Check if session is already ended
                    if (existingSession.end_time) {
                        toast.error('This session has already been ended')
                        navigate(`/sessions/${id}`)  // Go to session detail instead
                        return
                    }

                    setSessionId(existingSession.id)
                    setSession(existingSession)
                    setIsPaused(!!existingSession.is_paused)

                    // Put back what has already been collected. Without this the
                    // tallies restart at zero on every return to the page and the
                    // session looks as though it began again.
                    const alreadyRecorded = restoredEntries(existingSession)
                    setSessionData(alreadyRecorded)
                    setNotes(restoredNotes(existingSession))
                    setZeroRecordedPrograms(zeroRecordedProgramIds(alreadyRecorded))

                    // Get client and program from the session
                    // Note: backend returns client as nested object {id, first_name, last_name}
                    const clientData = await getClient(existingSession.client.id)
                    setClient(clientData)

                    // Get program - use first from session or fallback to URL param
                    if (existingSession.programs?.[0]?.id) {
                        const programData = await getProgram(existingSession.programs[0].id)
                        setProgram(programData)
                    } else {
                        const programData = await getProgram(programId)
                        setProgram(programData)
                    }
                    toast.info(
                        alreadyRecorded.length
                            ? `Continuing session — ${alreadyRecorded.length} ${alreadyRecorded.length === 1 ? 'entry' : 'entries'} already recorded`
                            : 'Continuing session'
                    )
                } else {
                    // Create a new session
                    const [clientData, programData] = await Promise.all([
                        getClient(clientId),
                        getProgram(programId)
                    ])

                    // Validate program belongs to this client
                    if (programData.client_id !== clientData.id) {
                        toast.error('This program does not belong to this client')
                        navigate(`/clients/${clientData.id}`)
                        return
                    }

                    setClient(clientData)
                    setProgram(programData)

                    // Reaching this page again without a session id in the address
                    // bar — a refresh, a locked screen, a re-tapped link — used to
                    // open a second session against the same learner and leave the
                    // first one running with data in it. Continue today's instead.
                    // Backdating is exempt: that is a deliberate request for a
                    // session on another date.
                    if (!sessionDate) {
                        const { getSessions, getSession: fetchSession } = await import('../services/sessions')
                        const openToday = findResumableSession(
                            await getSessions({ clientId: parseInt(clientId) }),
                            { userId: user?.id }
                        )

                        if (openToday) {
                            const resumed = await fetchSession(openToday.id)
                            const alreadyRecorded = restoredEntries(resumed)

                            setSessionId(resumed.id)
                            setSession(resumed)
                            setIsPaused(!!resumed.is_paused)
                            setSessionData(alreadyRecorded)
                            setNotes(restoredNotes(resumed))
                            setZeroRecordedPrograms(zeroRecordedProgramIds(alreadyRecorded))

                            saveActiveSession(resumed.id, clientId)
                            acquireSessionLock(resumed.id)

                            toast.info(
                                alreadyRecorded.length
                                    ? `Continuing today's session — ${alreadyRecorded.length} ${alreadyRecorded.length === 1 ? 'entry' : 'entries'} already recorded`
                                    : "Continuing today's session"
                            )
                            return
                        }
                    }

                    const { startSession } = await import('../services/sessions')
                    const newSession = await startSession(parseInt(clientId), sessionDate)
                    setSessionId(newSession.id)
                    setSession(newSession)
                    toast.success('Session started')

                    // Save session for recovery (browser refresh)
                    saveActiveSession(newSession.id, clientId)
                    acquireSessionLock(newSession.id)
                }
            } catch (err) {
                console.error('Failed to initialize session:', err)
                toast.error(err.message || 'Failed to load session')
                navigate('/sessions')
            } finally {
                setLoading(false)
            }
        }
        initSession()
    }, []) // Empty deps - only run once on mount

    // Load user settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getUserSettings()
                setUserSettings(settings)
            } catch (err) {
                console.error('Failed to load user settings:', err)
            }
        }
        loadSettings()
    }, [])

    // Auto-save notes at configured interval
    useEffect(() => {
        if (!sessionId || !userSettings.auto_save_interval) return

        const intervalMs = userSettings.auto_save_interval * 1000

        const autoSaveInterval = setInterval(async () => {
            if (notes.trim()) {
                try {
                    // Just update the last save time to show indicator
                    // Actual notes are saved on session end
                    setLastAutoSave(new Date())
                } catch (err) {
                    console.error('Auto-save failed:', err)
                }
            }
        }, intervalMs)

        return () => clearInterval(autoSaveInterval)
    }, [sessionId, userSettings.auto_save_interval, notes])

    // Load all programs for client (for sidebar)
    useEffect(() => {
        const loadPrograms = async () => {
            if (!client?.id) return
            try {
                const allPrograms = await getPrograms({ clientId: client.id })
                setPrograms(allPrograms)
            } catch (err) {
                console.error('Failed to load programs:', err)
            }
        }
        loadPrograms()
    }, [client?.id])

    // Load targets when program changes
    useEffect(() => {
        const loadTargets = async () => {
            if (!program?.id) return
            try {
                const programTargets = await getTargets(program.id)
                // Filter to only show 'active' targets during session (hide 'on-hold', 'mastered', etc.)
                const activeTargets = programTargets.filter(t => t.status === 'active')
                setTargets(activeTargets)
                // Held from every target, not the active ones, because the whole
                // point is to account for the ones that are missing from the list.
                setTargetsNotice(unavailableTargetsNotice(programTargets))
                // Select first active target by default
                setSelectedTarget(activeTargets[0] || null)
            } catch (err) {
                console.error('Failed to load targets:', err)
                setTargets([])
                setTargetsNotice(null)
            }
        }
        loadTargets()
    }, [program?.id])

    // Switch to different program
    const handleProgramSwitch = async (newProgram) => {
        if (newProgram.id === program?.id) return
        try {
            const programData = await getProgram(newProgram.id)
            setProgram(programData)
            toast.info(`Switched to ${newProgram.name}`)
        } catch (err) {
            toast.error(err.message || 'Failed to switch program')
        }
    }

    // Calculate stats - FILTERED BY CURRENT PROGRAM
    const currentProgramData = sessionData.filter(d => d.program_id === program?.id)

    const trialStats = {
        correct: currentProgramData.filter(d => d.result === 'correct').length,
        incorrect: currentProgramData.filter(d => d.result === 'incorrect').length,
        total: currentProgramData.filter(d => d.result).length
    }

    const frequencyCount = currentProgramData.reduce((sum, d) => sum + (d.count || 0), 0)

    const handleRecord = useCallback(async (data) => {
        if (!program || !sessionId) return

        const dataPoint = {
            program_id: program.id,
            data_type: data.data_type || program.data_type,
            target_id: selectedTarget?.id || null,  // Include target for progress tracking
            ...data
        }

        // Add to local state immediately for responsive UI
        const localEntry = {
            id: Date.now(),
            ...dataPoint,
            timestamp: new Date().toISOString()
        }
        setSessionData(prev => [...prev, localEntry])

        // Save to backend with retry queue
        try {
            const { recordSessionData } = await import('../services/sessions')
            const saved = await recordWithRetry(recordSessionData, sessionId, dataPoint)
            if (!saved) {
                // Queued for retry — don't alarm the user, data is safe locally
                console.warn('Data point queued for retry')
            }
        } catch (err) {
            console.error('Failed to record data:', err)
            // Check if session was ended (permanent error, don't retry)
            if (err.message?.includes('ended session')) {
                toast.error('Session has been ended - redirecting...')
                navigate('/sessions')
                return
            }
            toast.error(err.message || 'Failed to save data point')
        }
    }, [program, sessionId, selectedTarget, toast, navigate])

    // Handle subtract for frequency counting (records with negative count)
    const handleFrequencySubtract = useCallback(async () => {
        if (!program || !sessionId || frequencyCount <= 0) return

        const dataPoint = {
            program_id: program.id,
            data_type: 'frequency',
            target_id: selectedTarget?.id || null,
            count: -1  // Negative count for subtraction
        }

        // Add to local state immediately for responsive UI
        const localEntry = {
            id: Date.now(),
            ...dataPoint,
            timestamp: new Date().toISOString()
        }
        setSessionData(prev => [...prev, localEntry])

        // Save to backend with retry queue
        try {
            const { recordSessionData } = await import('../services/sessions')
            await recordWithRetry(recordSessionData, sessionId, dataPoint)
        } catch (err) {
            console.error('Failed to subtract:', err)
        }
    }, [program, sessionId, selectedTarget, frequencyCount])

    // Track whether zero has been recorded for current program
    const [zeroRecordedPrograms, setZeroRecordedPrograms] = useState(new Set())
    const isZeroRecorded = program ? zeroRecordedPrograms.has(program.id) : false

    // Handle record zero for frequency/behavior programs
    const handleRecordZero = useCallback(async () => {
        if (!program || !sessionId) return

        const dataPoint = {
            program_id: program.id,
            data_type: 'frequency',
            target_id: selectedTarget?.id || null,
            count: 0  // Explicit zero — behavior tracked but did not occur
        }

        // Add to local state
        const localEntry = {
            id: Date.now(),
            ...dataPoint,
            timestamp: new Date().toISOString()
        }
        setSessionData(prev => [...prev, localEntry])

        // Mark as zero recorded for this program
        setZeroRecordedPrograms(prev => new Set([...prev, program.id]))

        // Save to backend with retry queue
        try {
            const { recordSessionData } = await import('../services/sessions')
            const saved = await recordWithRetry(recordSessionData, sessionId, dataPoint)
            toast.success(saved ? 'Zero recorded — no behaviors occurred' : 'Zero recorded locally — syncing...')
        } catch (err) {
            console.error('Failed to record zero:', err)
            toast.error(err.message || 'Failed to record zero')
        }
    }, [program, sessionId, selectedTarget, toast])

    // Handle pause session
    const handlePause = async () => {
        if (!sessionId) return
        try {
            const result = await pauseSession(sessionId)
            setIsPaused(true)
            // Mirror the server's pause bookkeeping so the clock holds steady.
            setSession(prev => prev && {
                ...prev,
                is_paused: true,
                pause_started_at: result?.pause_started_at ?? prev.pause_started_at,
            })
            toast.info('Session paused')
        } catch (err) {
            console.error('Failed to pause session:', err)
            toast.error(err.message || 'Failed to pause session')
        }
    }

    // Handle resume session
    const handleResume = async () => {
        if (!sessionId) return
        try {
            const result = await resumeSession(sessionId)
            setIsPaused(false)
            // The server banks the closed pause into total_paused_seconds.
            setSession(prev => prev && {
                ...prev,
                is_paused: false,
                pause_started_at: null,
                total_paused_seconds: result?.total_paused_seconds ?? prev.total_paused_seconds,
            })
            toast.info('Session resumed')
        } catch (err) {
            console.error('Failed to resume session:', err)
            toast.error(err.message || 'Failed to resume session')
        }
    }

    const handleEndSession = async () => {
        if (!sessionId) {
            navigate('/sessions')
            return
        }

        setSaving(true)
        try {
            // Flush any pending data points from the retry queue first
            const { recordSessionData } = await import('../services/sessions')
            const retryResult = await processRetryQueue(recordSessionData)
            if (retryResult.succeeded > 0) {
                console.log(`Flushed ${retryResult.succeeded} queued data points before ending session`)
            }
            if (retryResult.failed > 0) {
                console.error(`${retryResult.failed} data points permanently failed to save`)
            }

            const { endSession } = await import('../services/sessions')
            await endSession(sessionId, notes)

            // Add notification
            addNotification(
                NOTIFICATION_TYPES.SESSION_COMPLETED,
                `Session for ${client?.first_name} ${client?.last_name} completed with ${sessionData.length} data points`
            )

            toast.success('Session saved successfully!')

            // Clear session recovery data and retry queue
            clearActiveSession()
            clearRetryQueue()
            clearTimers(sessionId)

            navigate('/sessions')
        } catch (err) {
            console.error('Failed to end session:', err)
            toast.error(err.message || 'Failed to save session')
        } finally {
            setSaving(false)
        }
    }

    // Show loading state
    if (loading || !client || !program) {
        return (
            <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Starting session...</p>
                </div>
            </div>
        )
    }


    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            {/* Session Header */}
            <header className={`fixed top-0 left-0 right-0 h-16 z-50 shadow-lg ${isPaused ? 'bg-amber-500' : 'hero-gradient'}`}>
                <div className="h-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEndSession}
                            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                        >
                            <StopCircle size={18} />
                            End Session
                        </button>

                        {/* Pause/Resume Button */}
                        {isPaused ? (
                            <button
                                onClick={handleResume}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                            >
                                <Play size={18} />
                                Resume
                            </button>
                        ) : (
                            <button
                                onClick={handlePause}
                                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                            >
                                <Pause size={18} />
                                Pause
                            </button>
                        )}
                    </div>

                    <div className="text-white text-lg font-medium flex items-center gap-3">
                        {isPaused && (
                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm animate-pulse">
                                PAUSED
                            </span>
                        )}
                        <span>{client.first_name} {client.last_name}</span>
                        <span className="text-white/50">•</span>
                        <span>{program.name}</span>
                        {selectedTarget && (
                            <>
                                <span className="text-white/50">→</span>
                                <span className="text-white/70">{selectedTarget.name}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Child-facing wellness check-in: hand the device over,
                            it returns here when the child is done. */}
                        {client?.id && (
                            <button
                                onClick={() => navigate(`/clients/${client.id}/wellness-checkin${sessionId ? `?session=${sessionId}` : ''}`)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                                title="Hand the device to the child for a quick wellness check-in"
                            >
                                <Smile size={16} />
                                Wellness Check-In
                            </button>
                        )}
                        <div className={`text-white font-heading text-2xl font-bold font-mono ${isPaused ? 'animate-pulse' : ''}`}>
                            {formatTime}
                        </div>
                        {lastAutoSave && (
                            <span className="text-green-300 text-xs flex items-center gap-1">
                                ✓ Auto-saved
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Layout with Sidebar */}
            <div className="pt-16 flex">
                {/* Sidebar */}
                <aside className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
                    <div className="w-72 h-full flex flex-col">
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-heading font-bold text-gray-900 flex items-center gap-2">
                                <FileText size={18} className="text-[#159DB3]" />
                                Programs & Targets
                            </h3>
                        </div>

                        {/* Programs List - Grouped by Type */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {/* Render grouped programs: Behavior first, then Skill */}
                            {[{ type: 'behavior', label: 'Behavior Reduction', color: 'text-red-600', bg: 'bg-red-50' },
                              { type: 'skill', label: 'Skill Acquisition', color: 'text-blue-600', bg: 'bg-blue-50' }]
                              .map(group => {
                                const groupPrograms = programs.filter(p => p.program_type === group.type)
                                if (groupPrograms.length === 0) return null
                                return (
                                    <div key={group.type} className="mb-3">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 ${group.color} ${group.bg} rounded-lg mb-1`}>
                                            {group.label}
                                        </p>
                                        {groupPrograms.map(prog => {
                                            const activeTimer = durationTimers.get(prog.id)
                                            const hasActiveTimer = activeTimer?.isRunning
                                            return (
                                            <div key={prog.id}>
                                                <button
                                                    onClick={() => handleProgramSwitch(prog)}
                                                    className={`w-full text-left p-3 rounded-xl transition-all ${program?.id === prog.id
                                                        ? 'bg-[#159DB3] text-white'
                                                        : 'hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold truncate flex-1 ${program?.id === prog.id ? 'text-white' : 'text-gray-900'}`}>
                                                            {prog.name}
                                                        </p>
                                                        {hasActiveTimer && (
                                                            <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                                                <Timer size={10} /> REC
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${program?.id === prog.id ? 'text-white/70' : 'text-gray-500'}`}>
                                                        {prog.data_type} • {prog.program_type}
                                                    </p>
                                                </button>

                                                {/* Show targets for selected program */}
                                                {program?.id === prog.id && targets.length > 0 && (
                                                    <div className="ml-3 mt-2 space-y-1">
                                                        {targets.map(target => (
                                                            <button
                                                                key={target.id}
                                                                onClick={() => setSelectedTarget(target)}
                                                                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${selectedTarget?.id === target.id
                                                                    ? 'bg-[#E0F4F7] text-[#159DB3]'
                                                                    : 'hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <Target size={14} className={selectedTarget?.id === target.id ? 'text-[#159DB3]' : 'text-gray-400'} />
                                                                <span className="truncate text-sm">{target.name}</span>
                                                                <span className={`ml-auto text-xs ${target.status === 'mastered' ? 'text-green-600' : 'text-gray-400'}`}>
                                                                    {target.current_accuracy.toFixed(0)}%
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            )
                                        })}
                                    </div>
                                )
                              })}

                            {programs.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No programs found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Sidebar Toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`fixed top-24 z-50 bg-white shadow-lg border border-gray-200 p-2 rounded-r-xl transition-all ${sidebarOpen ? 'left-72' : 'left-0'}`}
                >
                    {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} py-8 px-6`}>
                    <div className="max-w-xl mx-auto">
                        {/* Selected Target Badge */}
                        {selectedTarget && (
                            <div className="mb-4 bg-[#E0F4F7] rounded-xl p-3 flex items-center gap-3">
                                <Target size={18} className="text-[#159DB3]" />
                                <span className="font-medium text-[#159DB3]">
                                    Recording for: {selectedTarget.name}
                                </span>
                                <span className="ml-auto text-sm text-[#159DB3]/70">
                                    {selectedTarget.current_accuracy.toFixed(0)}% accuracy
                                </span>
                            </div>
                        )}

                        {/* Every target accounted for, when none can be collected
                            against. Without this the sidebar simply emptied and the
                            program read as broken (Dena, 3 Sept 2026). */}
                        {targetsNotice && (
                            <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-[#E0F4F7] flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle size={24} className="text-[#159DB3]" />
                                </div>
                                <p className="font-heading font-semibold text-gray-900 mb-1">{targetsNotice.title}</p>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">{targetsNotice.detail}</p>
                            </div>
                        )}

                        {/* Data Collection */}

                        {/* A target may override the program's data type with an interval/latency method. */}
                        {(() => {
                            const effectiveType = selectedTarget?.measurement_type || program.data_type
                            const isInterval = ['partial_interval', 'whole_interval', 'momentary_time_sampling'].includes(effectiveType)
                            const isLatency = effectiveType === 'latency'
                            if (isInterval) {
                                // The program's own type stands in for targets that
                                // do not override measurement_type, which is the
                                // ordinary case: without it nothing groups and the
                                // sheet renders blank (Dr Joe, 27 Aug 2026).
                                const intervalGroup = observableTogether(targets, selectedTarget?.id, program.data_type)
                                return (
                                    /* Every behaviour on the same interval
                                       length runs off one clock and is scored
                                       together, rather than each keeping its
                                       own timer (Dena, 20 Aug 2026). */
                                    <IntervalCollector
                                        key={intervalGroup.map((t) => t.id).join('-') || 'program'}
                                        targets={intervalGroup}
                                        method={effectiveType}
                                        onRecord={(d) => handleRecord({ ...d, data_type: effectiveType })}
                                        disabled={isPaused}
                                    />
                                )
                            }
                            if (isLatency) {
                                return (
                                    <LatencyCollector
                                        key={selectedTarget?.id}
                                        persistKey={selectedTarget?.id}
                                        onRecord={(d) => handleRecord({ ...d, data_type: 'latency' })}
                                        disabled={isPaused}
                                    />
                                )
                            }
                            return null
                        })()}

                        {/* Existing collectors render only when the target has NO measurement override. */}
                        {!selectedTarget?.measurement_type && program.data_type === 'trial' && (
                            <TrialDataCollector
                                onRecord={handleRecord}
                                stats={trialStats}
                                showPromptLevels={userSettings.show_prompt_levels}
                                disabled={isPaused}
                            />
                        )}
                        {!selectedTarget?.measurement_type && program.data_type === 'frequency' && (
                            <FrequencyDataCollector
                                onRecord={handleRecord}
                                onSubtract={handleFrequencySubtract}
                                onRecordZero={handleRecordZero}
                                count={frequencyCount}
                                disabled={isPaused}
                                zeroRecorded={isZeroRecorded}
                            />
                        )}
                        {!selectedTarget?.measurement_type && program.data_type === 'duration' && (
                            <DurationDataCollector
                                onRecord={handleRecord}
                                onStart={() => startDurationTimer(program.id)}
                                onStop={() => stopDurationTimer(program.id)}
                                onReset={() => resetDurationTimer(program.id)}
                                onAdjust={(delta) => adjustDurationTimer(program.id, delta)}
                                durationSeconds={elapsedSeconds(durationTimers.get(program.id) || createTimer(), now)}
                                isTracking={durationTimers.get(program.id)?.isRunning || false}
                                disabled={isPaused}
                            />
                        )}
                        {!selectedTarget?.measurement_type && program.data_type === 'task_analysis' && (
                            <TaskAnalysisCollector programId={program.id} onRecord={handleRecord} disabled={isPaused} />
                        )}

                        {/* Quick Notes */}
                        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <label className="label-uppercase block mb-3">SESSION NOTES</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any observations or notes from this session..."
                                disabled={isPaused}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-base min-h-[120px] resize-y focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${isPaused ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50'}`}
                            />
                        </div>

                        {/* End Session Button */}
                        <button
                            onClick={handleEndSession}
                            disabled={saving}
                            className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <StopCircle size={24} />
                            {saving ? 'Saving Session...' : 'End Session & Save'}
                        </button>
                    </div>
                </main>

                {/* Floating Duration Timer Pills */}
                <FloatingDurationPills
                    durationTimers={durationTimers}
                    programs={programs}
                    currentProgramId={program?.id}
                    onJumpToProgram={handleProgramSwitch}
                    onStopTimer={stopAndRecordDurationTimer}
                    now={now}
                />
            </div>
        </div>
    )
}
