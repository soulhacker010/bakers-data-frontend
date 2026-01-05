import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Card } from '../components/ui'
import { ArrowLeft, Calendar } from 'lucide-react'

export default function AddClientPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        diagnosis: '',
        notes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate required fields
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            setError('First name and last name are required')
            setLoading(false)
            return
        }

        try {
            // Mock save - will connect to backend later
            console.log('Saving client:', formData)

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Navigate back to clients list
            navigate('/clients')
        } catch (err) {
            setError('Failed to save client. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <Link
                        to="/clients"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Clients
                    </Link>

                    <p className="label-uppercase-light mb-2">N E W &nbsp; C L I E N T</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white">
                        Add a Client
                    </h1>
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
                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="First Name *"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Alex"
                                required
                            />
                            <Input
                                label="Last Name *"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Johnson"
                                required
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="relative">
                            <Input
                                label="Date of Birth"
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="pr-10"
                            />
                            <Calendar size={18} className="absolute right-4 bottom-3 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Diagnosis */}
                        <Input
                            label="Diagnosis"
                            name="diagnosis"
                            value={formData.diagnosis}
                            onChange={handleChange}
                            placeholder="e.g., Autism Spectrum Disorder"
                        />

                        {/* Notes */}
                        <div>
                            <label className="label-uppercase block mb-2">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Additional notes about the client (preferences, reinforcers, etc.)"
                                className="input-premium min-h-[120px] resize-y"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <Button type="submit" loading={loading}>
                                {loading ? 'Saving...' : 'Save Client'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/clients')}
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
