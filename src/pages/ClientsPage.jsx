import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Card, Modal, Badge, ListSkeleton, Avatar } from '../components/ui'
import { getClients } from '../services/clients'
import { useToast } from '../context/ToastContext'
import { Plus, Search, Users, Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

// Client Selection Modal
function ClientSelectModal({ isOpen, onClose, clients, onSelect }) {
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()

    const filteredClients = clients.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select client"
            footer={
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Need someone new?</p>
                    <Button
                        icon={<Plus size={18} />}
                        onClick={() => {
                            onClose()
                            navigate('/clients/new')
                        }}
                    >
                        Add new client
                    </Button>
                </div>
            }
        >
            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                        autoFocus
                    />
                </div>
            </div>

            {/* Client List */}
            <div className="max-h-64 overflow-y-auto">
                {filteredClients.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="font-medium text-gray-900 mb-1">No clients found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <div
                            key={client.id}
                            onClick={() => onSelect(client)}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <Avatar name={`${client.first_name} ${client.last_name}`} size={40} />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{client.first_name} {client.last_name}</p>
                                <p className="text-sm text-gray-500">{client.programs_count || 0} programs</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                        </div>
                    ))
                )}
            </div>
        </Modal>
    )
}

// Client Card
function ClientCard({ client, onClick }) {
    return (
        <Card hover onClick={onClick} className="p-6 group">
            <div className="flex items-start justify-between mb-4">
                <Avatar name={`${client.first_name} ${client.last_name}`} size={56} />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E0F4F7] text-[#159DB3]">
                    {client.programs_count || 0} PROGRAMS
                </span>
            </div>

            <h3 className="font-heading text-xl font-bold text-gray-900 mb-1 group-hover:text-[#159DB3] transition-colors">
                {client.first_name} {client.last_name}
            </h3>

            <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                {client.diagnosis || 'No diagnosis specified'}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    Age {client.age || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {client.last_session ? format(new Date(client.last_session), 'MMM d, yyyy') : 'No sessions'}
                </span>
            </div>
        </Card>
    )
}

export default function ClientsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()

    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)

    // Fetch clients on mount
    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true)
                const data = await getClients()
                setClients(data)
            } catch (err) {
                setError(err.message)
                toast.error('Failed to load clients')
            } finally {
                setLoading(false)
            }
        }

        fetchClients()
    }, [])

    const filteredClients = clients.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="label-uppercase-light mb-2">C L I E N T S</p>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                Your Clients
                            </h1>
                            <p className="text-white/70">
                                {clients.length} clients on your roster
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/clients/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-[#159DB3] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                        >
                            <Plus size={20} />
                            Add Client
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search clients by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                        />
                    </div>

                    <Button variant="outline" onClick={() => setShowModal(true)}>
                        Quick Select
                    </Button>
                </div>

                {/* Client Grid */}
                {filteredClients.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Users size={40} className="text-gray-300" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">No clients found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search or add a new client.</p>
                        <Button icon={<Plus size={18} />} onClick={() => navigate('/clients/new')}>
                            Add Client
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onClick={() => navigate(`/clients/${client.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Client Selection Modal */}
            <ClientSelectModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                clients={clients}
                onSelect={(client) => {
                    setShowModal(false)
                    navigate(`/clients/${client.id}`)
                }}
            />
        </DashboardLayout>
    )
}
