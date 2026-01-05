import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { mockClients, mockStats } from '../data/mockData'
import {
    Play,
    Link as LinkIcon,
    Calendar,
    ArrowRight,
    Users,
    ClipboardCheck,
    MessageCircle,
    Plus
} from 'lucide-react'

// Action card for the hero section
function ActionCard({ icon: Icon, title, description, linkText, onClick }) {
    return (
        <div
            onClick={onClick}
            className="action-card cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">{description}</p>
            {linkText && (
                <button className="label-uppercase-light flex items-center gap-2 group-hover:text-white transition-colors">
                    {linkText}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>
    )
}

// Stat box for the hero section
function StatBox({ label, value, subtext }) {
    return (
        <div className="stat-box">
            <p className="label-uppercase-light mb-1">{label}</p>
            <p className="font-heading text-3xl font-bold text-white">{value}</p>
            <p className="text-white/60 text-xs mt-1">{subtext}</p>
        </div>
    )
}

// Workspace section card - uses our Card component internally
function WorkspaceCard({ title, description, children }) {
    return (
        <Card className="p-6">
            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-4">{description}</p>
            {children}
        </Card>
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Get first name for greeting
    const userName = user?.full_name?.split(' ')[0] || 'there'

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-12">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                        {/* Left: Welcome */}
                        <div className="lg:max-w-lg">
                            <p className="label-uppercase-light mb-3">W E L C O M E</p>
                            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4">
                                ABA Collect<br />
                                Dashboard — {userName}
                            </h1>
                            <p className="text-white/80 text-lg leading-relaxed mb-6">
                                Orchestrate assessments, manage therapy workflows, and keep track of every client journey from a single command center.
                            </p>
                            <p className="text-white/60 text-sm">
                                {mockClients.length} clients. Add your first profile to get started.
                            </p>
                        </div>

                        {/* Right: Stats */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <StatBox
                                    label="ACTIVE CLIENTS"
                                    value={mockStats.totalClients}
                                    subtext={`${mockStats.totalClients} total on roster`}
                                />
                                <StatBox
                                    label="SESSIONS THIS MONTH"
                                    value={mockStats.sessionsThisMonth}
                                    subtext="Sessions completed"
                                />
                            </div>
                            <StatBox
                                label="PROGRAMS ACTIVE"
                                value={mockStats.activePrograms}
                                subtext="Ready for data collection"
                            />
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                        <ActionCard
                            icon={Play}
                            title="Start Session"
                            description="Launch a data collection session instantly with pre-configured workflows for your client."
                            linkText="OPEN WORKFLOW"
                            onClick={() => navigate('/clients')}
                        />
                        <ActionCard
                            icon={LinkIcon}
                            title="Add Client"
                            description="Create a new client profile to begin tracking therapy progress."
                            linkText="ADD CLIENT"
                            onClick={() => navigate('/clients/new')}
                        />
                    </div>
                </div>
            </div>

            {/* Workspace Section */}
            <div className="px-6 py-10 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WorkspaceCard
                        title="Workspace checklist"
                        description="Work through these quick tasks to keep your ABA workspace ready for clinicians and clients."
                    >
                        <div className="space-y-3">
                            {[
                                { done: true, text: 'Set up your account profile' },
                                { done: true, text: 'Configure therapy settings' },
                                { done: false, text: 'Add your first client' },
                                { done: false, text: 'Create a therapy program' },
                                { done: false, text: 'Complete a data collection session' },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}>
                                        {item.done && <ClipboardCheck size={12} />}
                                    </div>
                                    <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-700'}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </WorkspaceCard>

                    <WorkspaceCard
                        title="Workspace summary"
                        description="A snapshot of where things stand right now."
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                                        <Users size={20} className="text-primary" />
                                    </div>
                                    <span className="font-medium text-gray-700">Total Clients</span>
                                </div>
                                <span className="font-heading text-2xl font-bold text-gray-900">{mockStats.totalClients}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Calendar size={20} className="text-blue-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">Sessions This Month</span>
                                </div>
                                <span className="font-heading text-2xl font-bold text-gray-900">{mockStats.sessionsThisMonth}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <MessageCircle size={20} className="text-purple-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">Active Programs</span>
                                </div>
                                <span className="font-heading text-2xl font-bold text-gray-900">{mockStats.activePrograms}</span>
                            </div>
                        </div>
                    </WorkspaceCard>
                </div>

                {/* Recent Clients Section - compact grid */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-gray-900">Recent Clients</h2>
                        <Button
                            variant="link"
                            size="sm"
                            icon={<Plus size={16} />}
                            onClick={() => navigate('/clients/new')}
                        >
                            Add Client
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {mockClients.slice(0, 3).map((client) => (
                            <Card
                                key={client.id}
                                hover
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className="p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                                        {client.first_name[0]}{client.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{client.first_name} {client.last_name}</p>
                                        <p className="text-xs text-gray-500">{client.programs_count} programs</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
