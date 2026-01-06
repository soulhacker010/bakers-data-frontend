import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Card, ConfirmModal } from '../components/ui'
import { mockClients } from '../data/mockData'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function EditClientPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    // Get client from mock data
    const client = mockClients.find(c => c.id === parseInt(id))

    const [formData, setFormData] = useState({
        first_name: client?.first_name || '',
        last_name: client?.last_name || '',
        date_of_birth: client?.date_of_birth || '',
        diagnosis: client?.diagnosis || '',
        notes: client?.notes || ''
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setSaved(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Mock save - will connect to backend later
        console.log('Updating client:', { id, ...formData })

        setTimeout(() => {
            setSaving(false)
            setSaved(true)
            toast.success('Client saved successfully!')
            setTimeout(() => navigate(`/clients/${id}`), 1000)
        }, 500)
    }

    const handleDelete = () => {
        console.log('Deleting client:', id)
        toast.success(`Client "${client?.first_name} ${client?.last_name}" deleted successfully`)
        navigate('/clients')
    }

    if (!client) {
        return (
            <DashboardLayout>
                <div className="px-6 py-16 text-center">
                    <p className="text-gray-500">Client not found</p>
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
                        onClick={() => navigate(`/clients/${id}`)}
                        className="text-white/70 hover:text-white hover:bg-white/10 mb-4"
                        icon={<ArrowLeft size={18} />}
                    >
                        Back to Client
                    </Button>
                    <p className="label-uppercase-light mb-2">E D I T &nbsp; C L I E N T</p>
                    <h1 className="font-heading text-3xl font-bold text-white">
                        {client.first_name} {client.last_name}
                    </h1>
                </div>
            </div>

            {/* Form */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <form onSubmit={handleSubmit} className="max-w-2xl">
                    <Card className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="First Name *"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Last Name *"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Input
                            label="Date of Birth"
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                        />

                        <Input
                            label="Diagnosis"
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleChange}
                            placeholder="e.g., Autism Spectrum Disorder"
                        />

                        <div>
                            <label className="label-uppercase block mb-2">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="input-premium resize-none"
                                placeholder="Any additional notes about the client..."
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowDeleteModal(true)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                icon={<Trash2 size={18} />}
                            >
                                Delete Client
                            </Button>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/clients/${id}`)}
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

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Client?"
                message={`Are you sure you want to delete "${client.first_name} ${client.last_name}"? This will also delete all their programs and session data. This action cannot be undone.`}
                confirmText="Delete Client"
                type="danger"
            />
        </DashboardLayout>
    )
}
