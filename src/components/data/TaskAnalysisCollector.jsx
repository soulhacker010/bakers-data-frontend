/**
 * TaskAnalysisCollector - Data collection component for Task Analysis programs
 * Records prompt level for each step in a multi-step task
 */
import { useState, useEffect } from 'react'
import { getTaskSteps } from '../../services/taskSteps'
import { CheckCircle2, Loader2 } from 'lucide-react'

// Prompt levels for Task Analysis
const PROMPT_LEVELS = [
    { key: 'independent', label: 'IND', full: 'Independent', color: 'bg-green-500' },
    { key: 'full_physical', label: 'FP', full: 'Full Physical', color: 'bg-blue-500' },
    { key: 'partial_physical', label: 'PP', full: 'Partial Physical', color: 'bg-blue-400' },
    { key: 'gestural', label: 'G', full: 'Gestural', color: 'bg-yellow-500' },
    { key: 'verbal', label: 'V', full: 'Verbal', color: 'bg-orange-500' },
    { key: 'nr', label: 'NR', full: 'No Response', color: 'bg-gray-500' },
    { key: 'error', label: 'ERR', full: 'Error', color: 'bg-red-500' },
]

// Single step row component
function StepRow({ step, selectedLevel, onSelectLevel, disabled = false }) {
    return (
        <div className={`flex items-center gap-2 py-3 border-b border-gray-100 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
            {/* Step name */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{step.name}</p>
                {step.description && (
                    <p className="text-xs text-gray-500 truncate">{step.description}</p>
                )}
            </div>

            {/* Prompt level buttons */}
            <div className="flex gap-1">
                {PROMPT_LEVELS.map(level => (
                    <button
                        key={level.key}
                        onClick={() => !disabled && onSelectLevel(step.id, level.key)}
                        disabled={disabled}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${selectedLevel === level.key
                            ? `${level.color} text-white shadow-lg scale-105`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        title={level.full}
                    >
                        {level.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function TaskAnalysisCollector({ programId, onRecord, disabled = false }) {
    const [steps, setSteps] = useState([])
    const [loading, setLoading] = useState(true)
    const [stepData, setStepData] = useState({})  // { stepId: promptLevel }
    const [saving, setSaving] = useState(false)

    // Load steps
    useEffect(() => {
        const loadSteps = async () => {
            if (!programId) return

            try {
                setLoading(true)
                const data = await getTaskSteps(programId)
                setSteps(data)
                // Initialize all steps with no selection
                const initial = {}
                data.forEach(s => { initial[s.id] = null })
                setStepData(initial)
            } catch (err) {
                console.error('Failed to load steps:', err)
            } finally {
                setLoading(false)
            }
        }
        loadSteps()
    }, [programId])

    const handleSelectLevel = (stepId, level) => {
        setStepData(prev => ({
            ...prev,
            [stepId]: prev[stepId] === level ? null : level  // Toggle if same
        }))
    }

    const handleSubmit = async () => {
        // Collect all step responses
        const responses = Object.entries(stepData)
            .filter(([_, level]) => level !== null)
            .map(([stepId, level]) => ({
                step_id: parseInt(stepId),
                prompt_level: level,
                data_type: 'task_analysis'
            }))

        if (responses.length === 0) return

        setSaving(true)
        try {
            // Record each step
            for (const response of responses) {
                await onRecord(response)
            }

            // Reset selections
            const reset = {}
            steps.forEach(s => { reset[s.id] = null })
            setStepData(reset)
        } finally {
            setSaving(false)
        }
    }

    // Calculate progress
    const completedSteps = Object.values(stepData).filter(v => v !== null).length
    const totalSteps = steps.length
    const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    const independentSteps = Object.values(stepData).filter(v => v === 'independent').length

    if (loading) {
        return (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#159DB3]" />
                    <span className="ml-3 text-gray-500">Loading steps...</span>
                </div>
            </div>
        )
    }

    if (steps.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">No steps defined for this Task Analysis program</p>
                    <p className="text-sm text-gray-400 mt-2">Add steps when editing the program</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <p className="label-uppercase text-center mb-2">D A T A &nbsp; C O L L E C T I O N</p>
            <h2 className="font-heading text-2xl font-bold text-gray-900 text-center mb-2">
                Task Analysis
            </h2>
            <p className="text-gray-500 text-center text-sm mb-6">
                Record prompt level for each step
            </p>

            {/* Prompt Level Legend */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 pb-6 border-b border-gray-100">
                {PROMPT_LEVELS.map(level => (
                    <div key={level.key} className="flex items-center gap-1.5 text-xs">
                        <span className={`w-4 h-4 rounded ${level.color}`}></span>
                        <span className="text-gray-600">{level.full}</span>
                    </div>
                ))}
            </div>

            {/* Steps */}
            <div className="mb-6">
                {steps.map(step => (
                    <StepRow
                        key={step.id}
                        step={step}
                        selectedLevel={stepData[step.id]}
                        onSelectLevel={handleSelectLevel}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{completedSteps}/{totalSteps} steps</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#159DB3] to-[#0D7C8C] rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                {independentSteps > 0 && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {independentSteps} independent
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={completedSteps === 0 || saving || disabled}
                className="w-full py-4 bg-gradient-to-r from-[#159DB3] to-[#0D7C8C] text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Recording...' : `Record ${completedSteps} Step${completedSteps !== 1 ? 's' : ''}`}
            </button>
        </div>
    )
}
