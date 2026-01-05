import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { mockPrograms, mockClients } from '../data/mockData'
import { TrendingUp, TrendingDown, Play, ChevronRight } from 'lucide-react'

export default function ProgramsPage() {
    const navigate = useNavigate()

    // Get client name by ID
    const getClientName = (clientId) => {
        const client = mockClients.find(c => c.id === clientId)
        return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <p className="label-uppercase-light mb-2">P R O G R A M S</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                        All Programs
                    </h1>
                    <p className="text-white/70">
                        {mockPrograms.length} programs across all clients
                    </p>
                </div>
            </div>

            {/* Programs List */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="space-y-4">
                    {mockPrograms.map((program) => {
                        const isSkill = program.program_type === 'skill'
                        const isTrial = program.data_type === 'trial'

                        return (
                            <div
                                key={program.id}
                                className="card-premium p-6 group"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`badge-pill ${isSkill ? 'badge-skill' : 'badge-behavior'}`}>
                                                {isSkill ? 'Skill' : 'Behavior'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {getClientName(program.client_id)}
                                            </span>
                                        </div>
                                        <h3 className="font-heading text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                                            {program.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {program.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isTrial ? (
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Progress</p>
                                                <p className="font-heading text-xl font-bold text-primary">{program.progress}%</p>
                                            </div>
                                        ) : (
                                            <div className="text-right flex items-center gap-2">
                                                {program.trend === 'decreasing' ? (
                                                    <TrendingDown size={20} className="text-green-600" />
                                                ) : (
                                                    <TrendingUp size={20} className="text-red-500" />
                                                )}
                                                <span className={`font-semibold ${program.trend === 'decreasing' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {program.trend === 'decreasing' ? 'Decreasing' : 'Increasing'}
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate(`/programs/${program.id}/progress`)}
                                            className="btn-outline-premium text-sm"
                                        >
                                            View Graph
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </DashboardLayout>
    )
}
