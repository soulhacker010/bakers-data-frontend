import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button, Card, Avatar } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getClients } from '../services/clients'
import { getPrograms } from '../services/programs'
import { getSessions } from '../services/sessions'
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
    const { toast } = useToast()
    const navigate = useNavigate()

    // State for API data
    const [stats, setStats] = useState({ clients: 0, programs: 0, sessions: 0 })
    const [recentClients, setRecentClients] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch dashboard stats on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const [clientsData, programsData, sessionsData] = await Promise.all([
                    getClients(),
                    getPrograms(),
                    getSessions()
                ])
                setStats({
                    clients: clientsData.length,
                    programs: programsData.length,
                    sessions: sessionsData.length
                })
                setRecentClients(clientsData.slice(0, 3))
            } catch (err) {
                console.error('Failed to load dashboard stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

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
                                Data Sirena<br />
                                Dashboard — {userName}
                            </h1>
                            <p className="text-white/80 text-lg leading-relaxed mb-6">
                                Orchestrate assessments, manage therapy workflows, and keep track of every client journey from a single command center.
                            </p>
                            <p className="text-white/60 text-sm">
                                {loading ? '...' : `${stats.clients} clients. ${stats.clients === 0 ? 'Add your first profile to get started.' : ''}`}
                            </p>
                        </div>

                        {/* Right: Stats */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <StatBox
                                    label="ACTIVE CLIENTS"
                                    value={loading ? '...' : stats.clients}
                                    subtext={`${stats.clients} total on roster`}
                                />
                                <StatBox
                                    label="SESSIONS"
                                    value={loading ? '...' : stats.sessions}
                                    subtext="Sessions completed"
                                />
                            </div>
                            <StatBox
                                label="PROGRAMS ACTIVE"
                                value={loading ? '...' : stats.programs}
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

            {/* Workspace Section - Premium Redesign */}
            <div className="px-6 py-10 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Workspace Checklist - Dynamic */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                        {/* Decorative gradient blob */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#159DB3]/20 to-[#214B9D]/20 rounded-full blur-3xl"></div>

                        <div className="relative p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#159DB3] to-[#214B9D] flex items-center justify-center shadow-lg">
                                    <ClipboardCheck size={20} className="text-white" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-gray-900">Workspace Checklist</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 ml-13">Complete these tasks to set up your ABA workspace</p>

                            {/* Progress bar - Dynamic */}
                            {(() => {
                                const checklistItems = [
                                    { done: true, text: 'Set up your account profile', icon: '👤', action: null },
                                    { done: true, text: 'Configure therapy settings', icon: '⚙️', action: null },
                                    { done: stats.clients > 0, text: 'Add your first client', icon: '👥', action: () => navigate('/clients/new') },
                                    { done: stats.programs > 0, text: 'Create a therapy program', icon: '📋', action: () => navigate('/programs') },
                                    { done: stats.sessions > 0, text: 'Complete a data collection session', icon: '📊', action: () => navigate('/sessions/new') },
                                ]
                                const completedCount = checklistItems.filter(item => item.done).length
                                const progress = (completedCount / checklistItems.length) * 100

                                return (
                                    <>
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Progress</span>
                                                <span className="font-semibold text-[#159DB3]">{completedCount} of {checklistItems.length} completed</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#159DB3] to-[#214B9D] rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {checklistItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    onClick={item.action && !item.done ? item.action : undefined}
                                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 
                                                        ${item.action && !item.done ? 'cursor-pointer' : ''}
                                                        ${item.done
                                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
                                                            : 'bg-white border border-gray-100 hover:border-[#159DB3]/30 hover:shadow-md hover:-translate-y-0.5 group'
                                                        }`}
                                                >
                                                    <span className="text-xl">{item.icon}</span>
                                                    <div className={`flex-1 font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                        {item.text}
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all
                                                        ${item.done
                                                            ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200'
                                                            : 'border-2 border-gray-200 group-hover:border-[#159DB3]'
                                                        }`}
                                                    >
                                                        {item.done && <ClipboardCheck size={12} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Workspace Summary - Premium */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
                        {/* Decorative gradient blob */}
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"></div>

                        <div className="relative p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <Calendar size={20} className="text-white" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-gray-900">Workspace Summary</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 ml-13">A snapshot of where things stand right now</p>

                            <div className="space-y-4">
                                {/* Total Clients */}
                                <div className="group p-4 rounded-xl bg-gradient-to-r from-[#159DB3]/5 to-[#214B9D]/5 border border-[#159DB3]/10 hover:border-[#159DB3]/30 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#159DB3] to-[#214B9D] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Users size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Total Clients</p>
                                                <p className="text-xs text-gray-500">Active profiles</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-heading text-3xl font-bold bg-gradient-to-r from-[#159DB3] to-[#214B9D] bg-clip-text text-transparent">{loading ? '...' : stats.clients}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Sessions This Month */}
                                <div className="group p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-300 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Calendar size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Sessions This Month</p>
                                                <p className="text-xs text-gray-500">Data collection sessions</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-heading text-3xl font-bold text-blue-600">{loading ? '...' : stats.sessions}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Programs */}
                                <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 hover:border-purple-300 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <MessageCircle size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Active Programs</p>
                                                <p className="text-xs text-gray-500">Ready for data collection</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-heading text-3xl font-bold text-purple-600">{loading ? '...' : stats.programs}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Clients Section - Premium */}
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-heading text-xl font-bold text-gray-900">Recent Clients</h2>
                            <p className="text-gray-500 text-sm">Quick access to your active client profiles</p>
                        </div>
                        <Button
                            onClick={() => navigate('/clients/new')}
                            className="gap-2"
                        >
                            <Plus size={18} />
                            Add Client
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentClients.map((client, index) => (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/clients/${client.id}`)}
                                className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Hover gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#159DB3]/5 to-[#214B9D]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                                        <Avatar name={`${client.first_name} ${client.last_name}`} size={56} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-heading font-bold text-gray-900 group-hover:text-[#159DB3] transition-colors">
                                            {client.first_name} {client.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500">{client.programs_count} programs</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-[#159DB3] group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
