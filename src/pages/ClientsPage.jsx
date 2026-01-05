import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Card, Modal, Badge } from '../components/ui'
import { mockClients } from '../data/mockData'
import { Plus, Search, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Client Selection Modal - using our Modal component
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
                    <p className="label-uppercase text-primary">NEED SOMEONE NEW?</p>
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
                <div className="search-input-container">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input w-full bg-white border border-gray-200"
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
                    <div className="space-y-2">
                        {filteredClients.map((client) => (
                            <button
                                key={client.id}
                                onClick={() => onSelect(client)}
                                className="w-full text-left p-4 rounded-xl hover:bg-primary-light transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">{client.first_name} {client.last_name}</p>
                                    <p className="text-sm text-gray-500">Age {client.age} • {client.programs_count} programs</p>
                                </div>
                                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                    Select
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}

// Client Card - using our Card component
function ClientCard({ client, onClick }) {
    return (
        <Card hover onClick={onClick} className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center font-heading font-bold text-lg">
                    {client.first_name[0]}{client.last_name[0]}
                </div>
                <Badge variant="skill">
                    {client.programs_count} programs
                </Badge>
            </div>

            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {client.first_name} {client.last_name}
            </h3>

            <p className="text-sm text-gray-500 mb-4">
                {client.diagnosis || 'No diagnosis specified'}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                    <Users size={12} />
                    Age {client.age}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {client.last_session ? format(new Date(client.last_session), 'MMM d, yyyy') : 'No sessions'}
                </span>
            </div>
        </Card>
    )
}

export default function ClientsPage() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)

    // Filter clients based on search
    const filteredClients = mockClients.filter(client =>
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
                                {mockClients.length} clients on your roster
                            </p>
                        </div>

                        <Button
                            icon={<Plus size={20} />}
                            onClick={() => navigate('/clients/new')}
                            className="bg-white text-primary hover:bg-gray-100"
                        >
                            Add Client
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {/* Search & Filters */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="search-input-container flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search clients by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input w-full bg-white border border-gray-200"
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
                clients={mockClients}
                onSelect={(client) => {
                    setShowModal(false)
                    navigate(`/clients/${client.id}`)
                }}
            />
        </DashboardLayout>
    )
}
