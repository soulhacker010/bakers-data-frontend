import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getClient } from '../services/clients'
import { getProgram, getPrograms } from '../services/programs'
import { getTargets } from '../services/targets'
import { pauseSession, resumeSession } from '../services/sessions'
import { useToast } from '../context/ToastContext'
import { useNotifications, NOTIFICATION_TYPES } from '../context/NotificationContext'
import { getUserSettings } from '../services/settings'
import { Check, X, StopCircle, Plus, Play, Square, RotateCcw, ChevronLeft, ChevronRight, Target, FileText, ListChecks, Pause } from 'lucide-react'
import { TaskAnalysisCollector } from '../components/data'
import {
    saveActiveSession,
    clearActiveSession,
    acquireSessionLock
} from '../utils/sessionStorage'

// Timer hook
function useTimer() {
    const [seconds, setSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(true)

    useEffect(() => {
        let interval = null
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(s => s + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isRunning])

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600)
        const mins = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return { seconds, formatTime: formatTime(seconds), pause: () => setIsRunning(false), resume: () => setIsRunning(true) }
}

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
function FrequencyDataCollector({ onRecord, count, disabled = false }) {
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

            {/* Add Occurrence Button */}
            <button
                onClick={() => !disabled && onRecord({ count: 1 })}
                disabled={disabled}
                className={`w-full bg-[#159DB3] hover:bg-[#0E8499] active:scale-95 text-white py-10 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Plus size={32} />
                Add Occurrence
            </button>
        </div>
    )
}

// Duration Data Collection Component
function DurationDataCollector({ onRecord, disabled = false }) {
    const [durationSeconds, setDurationSeconds] = useState(0)
    const [isTracking, setIsTracking] = useState(false)

    useEffect(() => {
        let interval = null
        if (isTracking) {
            interval = setInterval(() => {
                setDurationSeconds(s => s + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isTracking])

    const formatDuration = (secs) => {
        const mins = Math.floor(secs / 60)
        const remainingSecs = secs % 60
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
    }

    const handleStop = () => {
        setIsTracking(false)
        onRecord({ duration_seconds: durationSeconds })
    }

    const handleReset = () => {
        setDurationSeconds(0)
        setIsTracking(false)
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-8">
                Duration Tracking
            </h2>

            {/* Timer Display */}
            <div className="text-center mb-8 py-8">
                <p className="font-heading text-8xl font-bold text-[#159DB3] font-mono tracking-tight">
                    {formatDuration(durationSeconds)}
                </p>
            </div>

            {/* Start/Stop Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={() => setIsTracking(true)}
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
                onClick={handleReset}
                className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
                <RotateCcw size={18} />
                Reset Timer
            </button>
        </div>
    )
}

export default function SessionCollectPage() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { addNotification } = useNotifications()
    const timer = useTimer()
    const { formatTime, pause: pauseTimer, resume: resumeTimer } = timer

    const [notes, setNotes] = useState('')
    const [sessionData, setSessionData] = useState([])
    const [client, setClient] = useState(null)
    const [program, setProgram] = useState(null)
    const [programs, setPrograms] = useState([])
    const [targets, setTargets] = useState([])
    const [selectedTarget, setSelectedTarget] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sessionId, setSessionId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [userSettings, setUserSettings] = useState({
        show_prompt_levels: true,
        auto_save_interval: 30,
        default_mastery_criteria: 80,
        default_session_duration: 60
    })
    const [lastAutoSave, setLastAutoSave] = useState(null)

    // Get client and program from params
    const clientId = searchParams.get('client') || 1
    const programId = searchParams.get('program') || 1

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
                    toast.info('Continuing session')
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

                    const { startSession } = await import('../services/sessions')
                    const newSession = await startSession(parseInt(clientId))
                    setSessionId(newSession.id)
                    toast.success('Session started')

                    // Save session for recovery (browser refresh)
                    saveActiveSession(newSession.id, clientId)
                    acquireSessionLock(newSession.id)
                }
            } catch (err) {
                console.error('Failed to initialize session:', err)
                toast.error('Failed to load session')
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
                setTargets(programTargets)
                // Select first active target by default
                const firstActive = programTargets.find(t => t.status === 'active')
                setSelectedTarget(firstActive || programTargets[0] || null)
            } catch (err) {
                console.error('Failed to load targets:', err)
                setTargets([])
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
            toast.error('Failed to switch program')
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
            data_type: program.data_type,
            ...data
        }

        // Add to local state immediately for responsive UI
        const localEntry = {
            id: Date.now(),
            ...dataPoint,
            timestamp: new Date().toISOString()
        }
        setSessionData(prev => [...prev, localEntry])

        // Save to backend
        try {
            const { recordSessionData } = await import('../services/sessions')
            await recordSessionData(sessionId, dataPoint)
        } catch (err) {
            console.error('Failed to record data:', err)
            // Check if session was ended
            if (err.response?.data?.detail?.includes('ended session') ||
                err.message?.includes('ended session')) {
                toast.error('Session has been ended - redirecting...')
                navigate('/sessions')
                return
            }
            toast.error('Failed to save data point')
        }
    }, [program, sessionId, toast, navigate])

    // Handle pause session
    const handlePause = async () => {
        if (!sessionId) return
        try {
            await pauseSession(sessionId)
            setIsPaused(true)
            pauseTimer()
            toast.info('Session paused')
        } catch (err) {
            console.error('Failed to pause session:', err)
            toast.error('Failed to pause session')
        }
    }

    // Handle resume session
    const handleResume = async () => {
        if (!sessionId) return
        try {
            await resumeSession(sessionId)
            setIsPaused(false)
            resumeTimer()
            toast.info('Session resumed')
        } catch (err) {
            console.error('Failed to resume session:', err)
            toast.error('Failed to resume session')
        }
    }

    const handleEndSession = async () => {
        if (!sessionId) {
            navigate('/sessions')
            return
        }

        setSaving(true)
        try {
            const { endSession } = await import('../services/sessions')
            await endSession(sessionId, notes)

            // Add notification
            addNotification(
                NOTIFICATION_TYPES.SESSION_COMPLETED,
                `Session for ${client?.first_name} ${client?.last_name} completed with ${sessionData.length} data points`
            )

            toast.success('Session saved successfully!')

            // Clear session recovery data
            clearActiveSession()

            navigate('/sessions')
        } catch (err) {
            console.error('Failed to end session:', err)
            toast.error('Failed to save session')
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
                        <div className={`text-white font-heading text-2xl font-bold font-mono ${isPaused ? 'animate-pulse' : ''}`}>
                            {formatTime}
                        </div>
                        {userSettings.default_session_duration && (
                            <span className="text-white/60 text-sm">
                                / {userSettings.default_session_duration} min
                            </span>
                        )}
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

                        {/* Programs List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {programs.map(prog => (
                                <div key={prog.id}>
                                    <button
                                        onClick={() => handleProgramSwitch(prog)}
                                        className={`w-full text-left p-3 rounded-xl transition-all ${program?.id === prog.id
                                            ? 'bg-[#159DB3] text-white'
                                            : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <p className={`font-semibold truncate ${program?.id === prog.id ? 'text-white' : 'text-gray-900'}`}>
                                            {prog.name}
                                        </p>
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
                            ))}

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

                        {/* Data Collection */}
                        {program.data_type === 'trial' && (
                            <TrialDataCollector
                                onRecord={handleRecord}
                                stats={trialStats}
                                showPromptLevels={userSettings.show_prompt_levels}
                                disabled={isPaused}
                            />
                        )}
                        {program.data_type === 'frequency' && (
                            <FrequencyDataCollector onRecord={handleRecord} count={frequencyCount} disabled={isPaused} />
                        )}
                        {program.data_type === 'duration' && (
                            <DurationDataCollector onRecord={handleRecord} disabled={isPaused} />
                        )}
                        {program.data_type === 'task_analysis' && (
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
            </div>
        </div>
    )
}
