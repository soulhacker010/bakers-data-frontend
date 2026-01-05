import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { mockClients, mockPrograms } from '../data/mockData'
import { Check, X, StopCircle, Plus, Play, Square, RotateCcw } from 'lucide-react'

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
function TrialDataCollector({ onRecord, stats }) {
    const [selectedPrompt, setSelectedPrompt] = useState(null)

    const promptLevels = [
        { key: 'independent', label: 'Ind', full: 'Independent' },
        { key: 'verbal', label: 'Ver', full: 'Verbal' },
        { key: 'gestural', label: 'Ges', full: 'Gestural' },
        { key: 'physical', label: 'Phy', full: 'Physical' },
    ]

    const handleRecord = (result) => {
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
                    className="bg-green-500 hover:bg-green-600 active:scale-95 text-white py-16 px-6 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <Check size={48} strokeWidth={3} />
                    CORRECT
                </button>
                <button
                    onClick={() => handleRecord('incorrect')}
                    className="bg-red-500 hover:bg-red-600 active:scale-95 text-white py-16 px-6 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <X size={48} strokeWidth={3} />
                    INCORRECT
                </button>
            </div>

            {/* Prompt Level */}
            <div className="mb-8">
                <p className="label-uppercase text-center mb-4">PROMPT LEVEL (OPTIONAL)</p>
                <div className="grid grid-cols-4 gap-3">
                    {promptLevels.map((prompt) => (
                        <button
                            key={prompt.key}
                            onClick={() => setSelectedPrompt(selectedPrompt === prompt.key ? null : prompt.key)}
                            className={`py-4 px-3 rounded-xl text-sm font-semibold transition-all duration-150 border-2 ${selectedPrompt === prompt.key
                                    ? 'bg-primary-light border-primary text-primary'
                                    : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {prompt.label}
                        </button>
                    ))}
                </div>
            </div>

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
                    <p className="font-heading text-3xl font-bold text-primary">{accuracy}%</p>
                </div>
            </div>
        </div>
    )
}

// Frequency Data Collection Component
function FrequencyDataCollector({ onRecord, count }) {
    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-8">
                Frequency Counting
            </h2>

            {/* Count Display */}
            <div className="text-center mb-8 py-8">
                <p className="font-heading text-8xl font-bold text-primary">{count}</p>
                <p className="text-gray-500 mt-2 uppercase tracking-wider text-sm">Occurrences</p>
            </div>

            {/* Add Occurrence Button */}
            <button
                onClick={() => onRecord({ count: 1 })}
                className="w-full bg-primary hover:bg-primary-dark active:scale-95 text-white py-10 rounded-2xl text-2xl font-heading font-bold transition-all duration-150 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
                <Plus size={32} />
                Add Occurrence
            </button>
        </div>
    )
}

// Duration Data Collection Component
function DurationDataCollector({ onRecord }) {
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
                <p className="font-heading text-8xl font-bold text-primary font-mono tracking-tight">
                    {formatDuration(durationSeconds)}
                </p>
            </div>

            {/* Start/Stop Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={() => setIsTracking(true)}
                    disabled={isTracking}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-10 rounded-2xl text-xl font-heading font-bold transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                    <Play size={28} />
                    Start
                </button>
                <button
                    onClick={handleStop}
                    disabled={!isTracking}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-10 rounded-2xl text-xl font-heading font-bold transition-all flex items-center justify-center gap-3 shadow-lg"
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
    const { formatTime } = useTimer()

    const [notes, setNotes] = useState('')
    const [sessionData, setSessionData] = useState([])

    // Get client and program from params
    const clientId = searchParams.get('client') || 1
    const programId = searchParams.get('program') || 1
    const client = mockClients.find(c => c.id === parseInt(clientId)) || mockClients[0]
    const program = mockPrograms.find(p => p.id === parseInt(programId)) || mockPrograms[0]

    // Calculate stats
    const trialStats = {
        correct: sessionData.filter(d => d.result === 'correct').length,
        incorrect: sessionData.filter(d => d.result === 'incorrect').length,
        total: sessionData.filter(d => d.result).length
    }

    const frequencyCount = sessionData.reduce((sum, d) => sum + (d.count || 0), 0)

    const handleRecord = useCallback((data) => {
        const newEntry = {
            id: Date.now(),
            program_id: program.id,
            data_type: program.data_type,
            timestamp: new Date().toISOString(),
            ...data
        }
        setSessionData(prev => [...prev, newEntry])
    }, [program])

    const handleEndSession = () => {
        console.log('Session data:', { notes, data: sessionData })
        navigate(`/clients/${client.id}`)
    }

    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            {/* Session Header */}
            <header className="fixed top-0 left-0 right-0 h-16 hero-gradient z-50 shadow-lg">
                <div className="h-full px-6 flex items-center justify-between max-w-screen-xl mx-auto">
                    <button
                        onClick={handleEndSession}
                        className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                        <StopCircle size={18} />
                        End Session
                    </button>

                    <div className="text-white text-lg font-medium flex items-center gap-3">
                        <span>{client.first_name} {client.last_name}</span>
                        <span className="text-white/50">•</span>
                        <span>{program.name}</span>
                    </div>

                    <div className="text-white font-heading text-2xl font-bold font-mono">
                        {formatTime}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6">
                <div className="max-w-xl mx-auto">
                    {/* Data Collection */}
                    {program.data_type === 'trial' && (
                        <TrialDataCollector onRecord={handleRecord} stats={trialStats} />
                    )}
                    {program.data_type === 'frequency' && (
                        <FrequencyDataCollector onRecord={handleRecord} count={frequencyCount} />
                    )}
                    {program.data_type === 'duration' && (
                        <DurationDataCollector onRecord={handleRecord} />
                    )}

                    {/* Quick Notes */}
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <label className="label-uppercase block mb-3">SESSION NOTES</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any observations or notes from this session..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base min-h-[120px] resize-y focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
