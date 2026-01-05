import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { mockPrograms, mockClients } from '../data/mockData'
import { TrendingUp, TrendingDown, BarChart2, Target, Activity, Plus, Search, Filter } from 'lucide-react'

export default function ProgramsPage() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, skill, behavior

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = mockClients.find(c => c.id === clientId)
        return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
    }

    // Filter programs
    const filteredPrograms = mockPrograms.filter(program => {
        const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getClientName(program.client_id).toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || program.program_type === filterType
        return matchesSearch && matchesType
    })

    return (
        <DashboardLayout>
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
                                {mockPrograms.length} programs across all clients
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/programs/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-[#1A8B73] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
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
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1A8B73]/20 focus:border-[#1A8B73]"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'skill', label: 'Skills' },
                            { key: 'behavior', label: 'Behaviors' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterType(tab.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === tab.key
                                        ? 'bg-white text-[#1A8B73] shadow-sm'
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
                                    className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#1A8B73]/20 transition-all group cursor-pointer"
                                    onClick={() => navigate(`/programs/${program.id}`)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left side - Icon + Content */}
                                        <div className="flex items-start gap-4">
                                            {/* Program Type Icon */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSkill
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-pink-50 text-pink-600'
                                                }`}>
                                                {isSkill ? <Target size={24} /> : <Activity size={24} />}
                                            </div>

                                            {/* Content */}
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${isSkill
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-pink-100 text-pink-700'
                                                        }`}>
                                                        {isSkill ? 'Skill' : 'Behavior'}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {getClientName(program.client_id)}
                                                    </span>
                                                </div>
                                                <h3 className="font-heading text-xl font-bold text-gray-900 group-hover:text-[#1A8B73] transition-colors">
                                                    {program.name}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                                                    {program.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right side - Progress/Trend + Button */}
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            {isTrial ? (
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Progress</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#1A8B73] rounded-full transition-all"
                                                                style={{ width: `${program.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-heading text-lg font-bold text-[#1A8B73]">
                                                            {program.progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {program.trend === 'decreasing' ? (
                                                        <>
                                                            <TrendingDown size={20} className="text-green-600" />
                                                            <span className="font-semibold text-green-600">Decreasing</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingUp size={20} className="text-red-500" />
                                                            <span className="font-semibold text-red-500">Increasing</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/programs/${program.id}/progress`)
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:border-[#1A8B73] hover:text-[#1A8B73] transition-colors"
                                            >
                                                <BarChart2 size={16} />
                                                View Graph
                                            </button>
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
