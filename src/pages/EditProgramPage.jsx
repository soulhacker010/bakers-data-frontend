import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Select, Card, ConfirmModal } from '../components/ui'
import { getProgram, updateProgram, deleteProgram } from '../services/programs'
import { getClient } from '../services/clients'
import { ArrowLeft, Check, Archive } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import TargetsManager from '../components/programs/TargetsManager'

const programTypeOptions = [
    { value: 'skill', label: 'Skill Acquisition' },
    { value: 'behavior', label: 'Behavior Reduction' },
]

const dataTypeOptions = [
    { value: 'trial', label: 'Trial-Based' },
    { value: 'frequency', label: 'Frequency' },
    { value: 'duration', label: 'Duration' },
    { value: 'task_analysis', label: 'Task Analysis' },
]

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance (keep probing)' },
    { value: 'mastered', label: 'Mastered (met goal)' },
    { value: 'archived', label: 'Archived (removed)' },
]

export default function EditProgramPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [program, setProgram] = useState(null)
    const [client, setClient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        program_type: 'skill',
        data_type: 'trial',
        description: '',
        mastery_criteria: '',
        status: 'active'
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Fetch program and client data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const programData = await getProgram(id)
                setProgram(programData)
                setFormData({
                    name: programData.name || '',
                    program_type: programData.program_type || 'skill',
                    data_type: programData.data_type || 'trial',
                    description: programData.description || '',
                    mastery_criteria: programData.mastery_criteria || '',
                    status: programData.status || 'active'
                })

                if (programData.client_id) {
                    const clientData = await getClient(programData.client_id)
                    setClient(clientData)
                }
            } catch (err) {
                toast.error(err.message || 'Failed to load program')
                navigate('/programs')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, navigate, toast])

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

        try {
            await updateProgram(id, formData)
            setSaved(true)
            toast.success('Program saved successfully!')
            setTimeout(() => navigate(`/clients/${program?.client_id}`), 1000)
        } catch (err) {
            toast.error(err.message || 'Failed to save program')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteProgram(id)
            toast.success(`Program "${program?.name}" archived`)
            navigate(`/clients/${program?.client_id}`)
        } catch (err) {
            toast.error(err.message || 'Failed to archive program')
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#159DB3] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        )
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

                        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                            <Select
                                label="Program Status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={statusOptions}
                                placeholder=""
                            />
                            <p className="text-sm text-gray-500">
                                <b>Active</b> and <b>Maintenance</b> stay available for data collection.
                                <b> Mastered</b> and <b>Archived</b> are removed from daily collection but keep their data and graph — find them under the Archived tab on the client's profile.
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowDeleteModal(true)}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                icon={<Archive size={18} />}
                            >
                                Archive Program
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

                {/* Targets/Steps Manager */}
                {program && (
                    <div className="max-w-2xl mt-8 space-y-8">
                        <TargetsManager
                            programId={program.id}
                            dataType={formData.data_type}
                        />
                        {/* A task analysis has steps AND targets. Only the steps
                            were reachable, so its targets could not be edited
                            from anywhere in the app (Dena, 20 Aug 2026). */}
                        {formData.data_type === 'task_analysis' && (
                            <TargetsManager
                                programId={program.id}
                                dataType={formData.data_type}
                                mode="targets"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Archive this program?"
                message={`"${program.name}" will be moved to the Archived tab. Its session data and graph are kept, and you can restore it anytime — it just won't show up in data collection.`}
                confirmText="Archive Program"
                type="warning"
            />
        </DashboardLayout>
    )
}
