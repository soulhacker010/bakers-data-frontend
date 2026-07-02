import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { getPrograms, updateProgram } from '../services/programs'
import { getClients } from '../services/clients'
import { useToast } from '../context/ToastContext'
import { TrendingUp, TrendingDown, BarChart2, Target, Activity, Plus, Search, Filter, X, Archive, RotateCcw } from 'lucide-react'

export default function ProgramsPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, skill, behavior
    const [showClientPicker, setShowClientPicker] = useState(false)

    // State for API data
    const [programs, setPrograms] = useState([])
    const [archivedPrograms, setArchivedPrograms] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [programsData, clientsData] = await Promise.all([
                    getPrograms({ includeInactive: true }),
                    getClients()
                ])
                // Keep active and archived (inactive) programs separate so the
                // default view stays clean while archived ones remain findable.
                setPrograms(programsData.filter(p => p.is_active !== false))
                setArchivedPrograms(programsData.filter(p => p.is_active === false))
                setClients(clientsData)
            } catch (err) {
                toast.error('Failed to load programs')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [toast])

    // Restore an archived program back to active.
    const handleRestore = async (e, program) => {
        e.stopPropagation()
        try {
            await updateProgram(program.id, { is_active: true })
            toast.success(`"${program.name}" restored`)
            setArchivedPrograms(prev => prev.filter(p => p.id !== program.id))
            setPrograms(prev => [{ ...program, is_active: true }, ...prev])
            setFilterType('all')
        } catch (err) {
            toast.error(err.message || 'Failed to restore program')
        }
    }

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId)
        return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
    }

    // Filter programs. The "archived" tab draws from the inactive list; every
    // other tab draws from active programs.
    const source = filterType === 'archived' ? archivedPrograms : programs
    const filteredPrograms = source.filter(program => {
        const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getClientName(program.client_id).toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || filterType === 'archived' || program.program_type === filterType
        return matchesSearch && matchesType
    })

    // Handle client selection for new program
    const handleSelectClient = (clientId) => {
        setShowClientPicker(false)
        navigate(`/clients/${clientId}/programs/new`)
    }

    return (
        <DashboardLayout>
            {/* Client Picker Modal */}
            {showClientPicker && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-heading text-xl font-bold text-gray-900">Select a Client</h2>
                            <button onClick={() => setShowClientPicker(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {clients.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No clients yet</p>
                                    <Button onClick={() => navigate('/clients/new')}>Add Client First</Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => handleSelectClient(client.id)}
                                            className="w-full p-4 rounded-xl border border-gray-200 hover:border-[#159DB3] hover:bg-[#E0F4F7] transition-all text-left flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#159DB3] to-[#214B9D] text-white flex items-center justify-center font-bold text-sm">
                                                {client.first_name[0]}{client.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{client.first_name} {client.last_name}</p>
                                                <p className="text-sm text-gray-500">{client.programs_count || 0} programs</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="label-uppercase-light mb-2">P R O G R A M S</p>
                            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                                All Programs
                            </h1>
                            <p className="text-white/70">
                                {loading ? '...' : `${programs.length} programs across all clients`}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowClientPicker(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-[#159DB3] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                        >
                            <Plus size={20} />
                            New Program
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="px-6 py-6 max-w-screen-xl mx-auto">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search programs or clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3]"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'skill', label: 'Skills' },
                            { key: 'behavior', label: 'Behaviors' },
                            ...(archivedPrograms.length > 0 ? [{ key: 'archived', label: 'Archived' }] : []),
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterType(tab.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === tab.key
                                    ? 'bg-white text-[#159DB3] shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Programs List */}
            <div className="px-6 pb-8 max-w-screen-xl mx-auto">
                {filteredPrograms.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Target size={40} className="text-gray-300" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">No programs found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPrograms.map((program) => {
                            const isSkill = program.program_type === 'skill'
                            const isTrial = program.data_type === 'trial'

                            return (
                                <div
                                    key={program.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 hover:shadow-lg hover:border-[#159DB3]/20 transition-all group cursor-pointer"
                                    onClick={() => navigate(`/programs/${program.id}`)}
                                >
                                    {/* Mobile: Stack layout, Desktop: Side by side */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        {/* Left side - Icon + Content */}
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            {/* Program Type Icon */}
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSkill
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-pink-50 text-pink-600'
                                                }`}>
                                                {isSkill ? <Target size={20} /> : <Activity size={20} />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${isSkill
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-pink-100 text-pink-700'
                                                        }`}>
                                                        {isSkill ? 'Skill' : 'Behavior'}
                                                    </span>
                                                    {program.is_active === false && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
                                                            <Archive size={12} /> Archived
                                                        </span>
                                                    )}
                                                    <span className="text-sm text-gray-500 truncate">
                                                        {getClientName(program.client_id)}
                                                    </span>
                                                </div>
                                                <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#159DB3] transition-colors">
                                                    {program.name}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                                                    {program.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right side - Progress/Trend + Button */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pl-13 sm:pl-0">
                                            {isTrial ? (
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Progress</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 sm:w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#159DB3] rounded-full transition-all"
                                                                style={{ width: `${program.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-heading text-base sm:text-lg font-bold text-[#159DB3]">
                                                            {program.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    {program.trend === 'decreasing' ? (
                                                        <>
                                                            <TrendingDown size={18} className="text-green-600" />
                                                            <span className="font-semibold text-green-600 text-sm sm:text-base">Decreasing</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingUp size={18} className="text-red-500" />
                                                            <span className="font-semibold text-red-500 text-sm sm:text-base">Increasing</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/programs/${program.id}/progress`)
                                                }}
                                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-xs sm:text-sm hover:border-[#159DB3] hover:text-[#159DB3] transition-colors whitespace-nowrap"
                                            >
                                                <BarChart2 size={14} />
                                                <span className="hidden xs:inline">View</span> Graph
                                            </button>
                                            {program.is_active === false && (
                                                <button
                                                    onClick={(e) => handleRestore(e, program)}
                                                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#159DB3] text-white rounded-xl font-semibold text-xs sm:text-sm hover:bg-[#0E8499] transition-colors whitespace-nowrap"
                                                >
                                                    <RotateCcw size={14} />
                                                    Restore
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
