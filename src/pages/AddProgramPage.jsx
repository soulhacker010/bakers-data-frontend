import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Card } from '../components/ui'
import { getClient } from '../services/clients'
import { createProgram } from '../services/programs'
import { createTarget } from '../services/targets'
import { createTaskStep } from '../services/taskSteps'
import { getUserSettings } from '../services/settings'
import { ArrowLeft, Plus, Trash2, Target, ListChecks, Edit3 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function AddProgramPage() {
    const { clientId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [client, setClient] = useState(null)
    const [pageLoading, setPageLoading] = useState(true)

    // Fetch client info
    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await getClient(clientId)
                setClient(data)
            } catch (err) {
                toast.error(err.message || 'Failed to load client')
                navigate('/clients')
            } finally {
                setPageLoading(false)
            }
        }
        fetchClient()
    }, [clientId, navigate, toast])

    const [formData, setFormData] = useState({
        name: '',
        program_type: 'skill',
        data_type: 'trial',
        description: '',
        mastery_criteria: ''
    })

    // Targets state - defaults will be updated when settings are loaded
    const [targets, setTargets] = useState([])
    const [defaultMastery, setDefaultMastery] = useState({ threshold: 80, sessions: 3 })
    const [newTarget, setNewTarget] = useState({
        name: '',
        mastery_threshold: 80,
        mastery_consecutive_sessions: 3
    })

    // Load user settings for default values
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getUserSettings()
                const threshold = settings.default_mastery_criteria || 80
                const sessions = settings.default_mastery_sessions || 3
                setDefaultMastery({ threshold, sessions })
                setNewTarget(prev => ({
                    ...prev,
                    mastery_threshold: threshold,
                    mastery_consecutive_sessions: sessions
                }))
            } catch (err) {
                console.error('Failed to load user settings:', err)
            }
        }
        loadSettings()
    }, [])

    // Task Analysis steps state
    const [steps, setSteps] = useState([])
    const [newStep, setNewStep] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleTargetChange = (e) => {
        const { name, value } = e.target
        setNewTarget(prev => ({ ...prev, [name]: name === 'name' ? value : parseInt(value) || 0 }))
    }

    const addTarget = () => {
        if (!newTarget.name.trim()) {
            toast.error('Target name is required')
            return
        }
        setTargets(prev => [...prev, { ...newTarget, id: Date.now() }])
        // Reset with user's default values
        setNewTarget({
            name: '',
            mastery_threshold: defaultMastery.threshold,
            mastery_consecutive_sessions: defaultMastery.sessions
        })
    }

    const removeTarget = (id) => {
        setTargets(prev => prev.filter(t => t.id !== id))
    }

    const [editingTarget, setEditingTarget] = useState(null)

    const startEditTarget = (target) => {
        setEditingTarget({ ...target })
    }

    const saveEditTarget = () => {
        if (!editingTarget) return
        setTargets(prev => prev.map(t => t.id === editingTarget.id ? editingTarget : t))
        setEditingTarget(null)
    }

    // Step handlers for Task Analysis
    const addStep = () => {
        if (!newStep.trim()) return
        setSteps(prev => [...prev, { id: Date.now(), name: newStep.trim() }])
        setNewStep('')
    }

    const removeStep = (id) => {
        setSteps(prev => prev.filter(s => s.id !== id))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!formData.name.trim()) {
            setError('Program name is required')
            toast.error('Please enter a program name')
            setLoading(false)
            return
        }

        try {
            // Create the program first
            const program = await createProgram(parseInt(clientId), formData)

            // Then create all targets for this program
            for (const target of targets) {
                await createTarget(program.id, {
                    name: target.name,
                    mastery_threshold: target.mastery_threshold,
                    mastery_consecutive_sessions: target.mastery_consecutive_sessions,
                    mastery_criteria: `${target.mastery_threshold}% accuracy over ${target.mastery_consecutive_sessions} consecutive sessions`
                })
            }

            // Create task analysis steps if program is task_analysis type
            if (formData.data_type === 'task_analysis') {
                for (let i = 0; i < steps.length; i++) {
                    await createTaskStep(program.id, {
                        name: steps[i].name,
                        position: i
                    })
                }
            }

            const stepCount = formData.data_type === 'task_analysis' ? steps.length : 0
            toast.success(`Program "${formData.name}" created with ${targets.length} targets and ${stepCount} steps!`)
            navigate(`/clients/${clientId}`)
        } catch (err) {
            setError(err.message || 'Failed to save program. Please try again.')
            toast.error(err.message || 'Failed to save program. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        )
    }

    const programTypes = [
        { value: 'skill', label: 'Skill Acquisition', description: 'Teaching new skills' },
        { value: 'behavior', label: 'Behavior Reduction', description: 'Reducing problem behaviors' }
    ]

    const dataTypes = [
        { value: 'trial', label: 'Trial-Based', description: 'Correct/incorrect responses with prompts' },
        { value: 'frequency', label: 'Frequency', description: 'Count occurrences of behavior' },
        { value: 'duration', label: 'Duration', description: 'Time duration of behavior' },
        { value: 'task_analysis', label: 'Task Analysis', description: 'Multi-step skills with prompt levels per step' }
    ]

    // If no client loaded, show error
    if (!client) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Client not found</p>
                        <Button onClick={() => navigate('/clients')}>Go to Clients</Button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Edit Target Modal */}
            {editingTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-4">Edit Target</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
                                <input
                                    type="text"
                                    value={editingTarget.name}
                                    onChange={(e) => setEditingTarget({ ...editingTarget, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mastery %</label>
                                    <input
                                        type="number"
                                        value={editingTarget.mastery_threshold}
                                        onChange={(e) => setEditingTarget({ ...editingTarget, mastery_threshold: parseInt(e.target.value) || 80 })}
                                        min="1"
                                        max="100"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sessions</label>
                                    <input
                                        type="number"
                                        value={editingTarget.mastery_consecutive_sessions}
                                        onChange={(e) => setEditingTarget({ ...editingTarget, mastery_consecutive_sessions: parseInt(e.target.value) || 3 })}
                                        min="1"
                                        max="10"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingTarget(null)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={saveEditTarget}
                                className="flex-1 px-4 py-3 bg-[#159DB3] text-white rounded-xl font-medium hover:bg-[#128a9e] transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <Link
                        to={`/clients/${clientId}`}
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to {client.first_name} {client.last_name}
                    </Link>

                    <p className="label-uppercase-light mb-2">N E W &nbsp; P R O G R A M</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white">
                        Add a Program
                    </h1>
                    <p className="text-white/70 mt-2">
                        For {client.first_name} {client.last_name}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="px-6 py-8 max-w-screen-md mx-auto">
                <Card className="p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Program Name */}
                        <Input
                            label="Program Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Expressive ID Animals"
                            required
                        />

                        {/* Program Type */}
                        <div>
                            <label className="label-uppercase block mb-3">Program Type *</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {programTypes.map((type) => (
                                    <label
                                        key={type.value}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.program_type === type.value
                                            ? 'border-primary bg-primary-light'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="program_type"
                                            value={type.value}
                                            checked={formData.program_type === type.value}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <p className="font-semibold text-gray-900">{type.label}</p>
                                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Data Type */}
                        <div>
                            <label className="label-uppercase block mb-3">Data Collection Type *</label>
                            <div className="space-y-3">
                                {dataTypes.map((type) => (
                                    <label
                                        key={type.value}
                                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.data_type === type.value
                                            ? 'border-primary bg-primary-light'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="data_type"
                                            value={type.value}
                                            checked={formData.data_type === type.value}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <p className="font-semibold text-gray-900">{type.label}</p>
                                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="label-uppercase block mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the target behavior or skill..."
                                className="input-premium min-h-[100px] resize-y"
                            />
                        </div>

                        {/* Targets Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target size={20} className="text-[#159DB3]" />
                                <label className="label-uppercase">Targets (Optional)</label>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Add specific targets within this program. For example, if the program is "Expressive ID Animals",
                                targets could be "Cat", "Dog", "Bird", etc.
                            </p>

                            {/* Existing targets list */}
                            {targets.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {targets.map((target, index) => (
                                        <div
                                            key={target.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                        >
                                            <span className="w-6 h-6 rounded-full bg-[#159DB3] text-white text-xs flex items-center justify-center font-bold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{target.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {target.mastery_threshold}% over {target.mastery_consecutive_sessions} sessions
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditTarget(target)}
                                                    className="p-1 text-gray-400 hover:text-[#159DB3] hover:bg-[#E0F4F7] rounded-lg"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTarget(target.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new target form */}
                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            name="name"
                                            value={newTarget.name}
                                            onChange={handleTargetChange}
                                            placeholder="Target name (e.g., Cat)"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="mastery_threshold"
                                            value={newTarget.mastery_threshold}
                                            onChange={handleTargetChange}
                                            placeholder="80%"
                                            min="1"
                                            max="100"
                                            className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3] text-center"
                                        />
                                        <input
                                            type="number"
                                            name="mastery_consecutive_sessions"
                                            value={newTarget.mastery_consecutive_sessions}
                                            onChange={handleTargetChange}
                                            placeholder="3"
                                            min="1"
                                            max="10"
                                            className="w-16 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3] text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-gray-500">
                                        Set accuracy % and consecutive sessions for mastery
                                    </p>
                                    <button
                                        type="button"
                                        onClick={addTarget}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#159DB3] hover:bg-[#E0F4F7] rounded-lg transition-colors"
                                    >
                                        <Plus size={16} />
                                        Add Target
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Task Analysis Steps Section - Only show for task_analysis type */}
                        {formData.data_type === 'task_analysis' && (
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ListChecks size={20} className="text-[#159DB3]" />
                                    <label className="label-uppercase">Task Analysis Steps</label>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Add the steps for this task analysis. For example, "Washing Hands" might have steps like
                                    "Turn on water", "Wet hands", "Apply soap", etc.
                                </p>

                                {/* Existing steps list */}
                                {steps.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {steps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                                            >
                                                <span className="w-6 h-6 rounded-full bg-[#159DB3] text-white text-xs flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </span>
                                                <p className="flex-1 font-medium text-gray-900">{step.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(step.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new step form */}
                                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newStep}
                                            onChange={(e) => setNewStep(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                                            placeholder="Step name (e.g., Turn on water)"
                                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                                        />
                                        <button
                                            type="button"
                                            onClick={addStep}
                                            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#159DB3] hover:bg-[#0D7C8C] rounded-xl transition-colors"
                                        >
                                            <Plus size={16} />
                                            Add Step
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <Button type="submit" loading={loading}>
                                {loading ? 'Saving...' : `Save Program${targets.length > 0 ? ` with ${targets.length} Target${targets.length > 1 ? 's' : ''}` : ''}${formData.data_type === 'task_analysis' && steps.length > 0 ? ` & ${steps.length} Step${steps.length > 1 ? 's' : ''}` : ''}`}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/clients/${clientId}`)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    )
}
