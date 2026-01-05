import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Select, Card } from '../components/ui'
import { mockPrograms, mockClients } from '../data/mockData'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'

const programTypeOptions = [
    { value: 'skill', label: 'Skill Acquisition' },
    { value: 'behavior', label: 'Behavior Reduction' },
]

const dataTypeOptions = [
    { value: 'trial', label: 'Trial-Based' },
    { value: 'frequency', label: 'Frequency' },
    { value: 'duration', label: 'Duration' },
]

export default function EditProgramPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    // Get program from mock data
    const program = mockPrograms.find(p => p.id === parseInt(id))
    const client = program ? mockClients.find(c => c.id === program.client_id) : null

    const [formData, setFormData] = useState({
        name: program?.name || '',
        program_type: program?.program_type || 'skill',
        data_type: program?.data_type || 'trial',
        description: program?.description || '',
        mastery_criteria: program?.mastery_criteria || '',
        is_active: program?.is_active ?? true
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setSaved(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Mock save - will connect to backend later
        console.log('Updating program:', { id, ...formData })

        setTimeout(() => {
            setSaving(false)
            setSaved(true)
            setTimeout(() => navigate(`/clients/${program?.client_id}`), 1000)
        }, 500)
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this program? All associated data will be lost.')) {
            console.log('Deleting program:', id)
            navigate(`/clients/${program?.client_id}`)
        }
    }

    if (!program) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 text-center">
                    <p className="text-gray-500">Program not found</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="hero-gradient px-6 py-8">
                <div className="max-w-screen-xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/clients/${program.client_id}`)}
                        className="text-white/70 hover:text-white hover:bg-white/10 mb-4"
                        icon={<ArrowLeft size={18} />}
                    >
                        Back to {client?.first_name}'s Profile
                    </Button>
                    <p className="label-uppercase-light mb-2">E D I T &nbsp; P R O G R A M</p>
                    <h1 className="font-heading text-3xl font-bold text-white">
                        {program.name}
                    </h1>
                </div>
            </div>

            {/* Form */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <Card className="p-8 space-y-6">
                        <Input
                            label="Program Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="Program Type"
                                name="program_type"
                                value={formData.program_type}
                                onChange={handleChange}
                                options={programTypeOptions}
                                placeholder=""
                            />
                            <Select
                                label="Data Type"
                                name="data_type"
                                value={formData.data_type}
                                onChange={handleChange}
                                options={dataTypeOptions}
                                placeholder=""
                            />
                        </div>

                        <div>
                            <label className="label-uppercase block mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="input-premium resize-none"
                                placeholder="Describe what this program targets..."
                            />
                        </div>

                        <Input
                            label="Mastery Criteria"
                            name="mastery_criteria"
                            value={formData.mastery_criteria}
                            onChange={handleChange}
                            placeholder="e.g., 80% accuracy across 3 consecutive sessions"
                        />

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                                <p className="font-medium text-gray-900">Active Program</p>
                                <p className="text-sm text-gray-500">Inactive programs won't appear in session collection</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                icon={<Trash2 size={18} />}
                            >
                                Delete Program
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/clients/${program.client_id}`)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={saving}
                                    icon={saved ? <Check size={18} /> : null}
                                >
                                    {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </DashboardLayout>
    )
}
