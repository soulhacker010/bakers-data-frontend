import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Card } from '../components/ui'
import { mockClients } from '../data/mockData'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function AddProgramPage() {
    const { clientId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Get client info
    const client = mockClients.find(c => c.id === parseInt(clientId)) || mockClients[0]

    const [formData, setFormData] = useState({
        name: '',
        program_type: 'skill',
        data_type: 'trial',
        description: '',
        mastery_criteria: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
            console.log('Saving program:', { ...formData, client_id: clientId })
            await new Promise(resolve => setTimeout(resolve, 500))
            toast.success(`Program "${formData.name}" created successfully!`)
            navigate(`/clients/${clientId}`)
        } catch (err) {
            setError('Failed to save program. Please try again.')
            toast.error('Failed to save program. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const programTypes = [
        { value: 'skill', label: 'Skill Acquisition', description: 'Teaching new skills' },
        { value: 'behavior', label: 'Behavior Reduction', description: 'Reducing problem behaviors' }
    ]

    const dataTypes = [
        { value: 'trial', label: 'Trial-Based', description: 'Correct/incorrect responses with prompts' },
        { value: 'frequency', label: 'Frequency', description: 'Count occurrences of behavior' },
        { value: 'duration', label: 'Duration', description: 'Time duration of behavior' }
    ]

    return (
        <DashboardLayout>
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
                            placeholder="e.g., Identify Colors"
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

                        {/* Mastery Criteria */}
                        <Input
                            label="Mastery Criteria"
                            name="mastery_criteria"
                            value={formData.mastery_criteria}
                            onChange={handleChange}
                            placeholder="e.g., 80% accuracy across 3 consecutive sessions"
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <Button type="submit" loading={loading}>
                                {loading ? 'Saving...' : 'Save Program'}
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
