import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { getClients } from '../services/clients'
import { getPrograms } from '../services/programs'
import { useToast } from '../context/ToastContext'
import {
    Search,
    User,
    Check,
    ArrowRight,
    Target,
    Activity,
    Play,
    ChevronRight,
    Calendar,
    CheckSquare,
    Square
} from 'lucide-react'

export default function NewSessionPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [step, setStep] = useState(1) // 1: Select Client, 2: Select Programs
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClient, setSelectedClient] = useState(null)
    const [selectedPrograms, setSelectedPrograms] = useState([])
    const [sessionDate, setSessionDate] = useState('')  // For backdating: 'YYYY-MM-DD' or empty

    // State for API data
    const [clients, setClients] = useState([])
    const [allPrograms, setAllPrograms] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch clients and programs on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [clientsData, programsData] = await Promise.all([
                    getClients(),
                    getPrograms()
                ])
                setClients(clientsData)
                setAllPrograms(programsData)
            } catch (err) {
                toast.error('Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [toast])

    // Filter clients based on search
    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [searchTerm, clients])

    // Get programs for selected client
    const clientPrograms = useMemo(() => {
        if (!selectedClient) return []
        return allPrograms.filter(p => p.client_id === selectedClient.id)
    }, [selectedClient, allPrograms])

    // Handle client selection - auto-select all programs
    const handleSelectClient = (client) => {
        setSelectedClient(client)
        // Auto-select all programs for this client
        const programIds = allPrograms.filter(p => p.client_id === client.id).map(p => p.id)
        setSelectedPrograms(programIds)
        setStep(2)
    }

    // Handle program toggle
    const toggleProgram = (programId) => {
        setSelectedPrograms(prev =>
            prev.includes(programId)
                ? prev.filter(id => id !== programId)
                : [...prev, programId]
        )
    }

    // Handle select all / deselect all
    const handleSelectAll = () => {
        if (selectedPrograms.length === clientPrograms.length) {
            setSelectedPrograms([])
        } else {
            setSelectedPrograms(clientPrograms.map(p => p.id))
        }
    }

    // Start the session
    const handleStartSession = () => {
        if (selectedPrograms.length === 0) return

        // Navigate to session collect with first program (can cycle through others)
        const firstProgram = selectedPrograms[0]
        let url = `/sessions/new/collect?client=${selectedClient.id}&program=${firstProgram}`
        if (sessionDate) {
            url += `&session_date=${sessionDate}`
        }
        navigate(url)
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <p className="label-uppercase-light mb-2">N E W &nbsp; S E S S I O N</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                        Start a Session
                    </h1>
                    <p className="text-white/70">
                        {step === 1
                            ? 'Select a client to begin therapy session'
                            : `Select programs for ${selectedClient?.first_name} ${selectedClient?.last_name}`
                        }
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
                <div className="max-w-screen-xl mx-auto flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#159DB3]' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#159DB3] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step > 1 ? <Check size={16} /> : '1'}
                        </div>
                        <span className="font-medium">Select Client</span>
                    </div>

                    <ChevronRight size={20} className="text-gray-300" />

                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#159DB3]' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#159DB3] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            2
                        </div>
                        <span className="font-medium">Select Programs</span>
                    </div>

                    <ChevronRight size={20} className="text-gray-300" />

                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">
                            3
                        </div>
                        <span className="font-medium">Collect Data</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                {step === 1 ? (
                    /* Step 1: Select Client */
                    <div className="max-w-2xl mx-auto">
                        {/* Search */}
                        <div className="relative mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3] text-lg"
                                autoFocus
                            />
                        </div>

                        {/* Client List */}
                        <div className="space-y-3">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-12">
                                    <User size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No clients found</p>
                                </div>
                            ) : (
                                filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-[#159DB3]/30 transition-all group text-left flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-[#E0F4F7] text-[#159DB3] flex items-center justify-center font-heading font-bold text-lg">
                                                {client.first_name[0]}{client.last_name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-heading text-xl font-bold text-gray-900 group-hover:text-[#159DB3] transition-colors">
                                                    {client.first_name} {client.last_name}
                                                </h3>
                                                <p className="text-gray-500 text-sm">
                                                    Age {client.age || 'N/A'} • {client.programs_count || allPrograms.filter(p => p.client_id === client.id).length} programs
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight size={24} className="text-gray-300 group-hover:text-[#159DB3] transition-colors" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    /* Step 2: Select Programs */
                    <div className="max-w-2xl mx-auto">
                        {/* Selected Client Header */}
                        <div className="bg-[#E0F4F7] rounded-2xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#159DB3] text-white flex items-center justify-center font-heading font-bold">
                                    {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-gray-900">
                                        {selectedClient.first_name} {selectedClient.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">Selected client</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setStep(1); setSelectedClient(null) }}
                                className="text-sm text-[#159DB3] font-medium hover:underline"
                            >
                                Change
                            </button>
                        </div>

                        {/* Backdate Session Option */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!sessionDate}
                                    onChange={(e) => setSessionDate(e.target.checked ? new Date().toISOString().split('T')[0] : '')}
                                    className="w-5 h-5 rounded border-gray-300 text-[#159DB3] focus:ring-[#159DB3]"
                                />
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Session for a different date?</span>
                                </div>
                            </label>
                            {sessionDate && (
                                <div className="mt-3 ml-8">
                                    <input
                                        type="date"
                                        value={sessionDate}
                                        onChange={(e) => setSessionDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#159DB3]/20 focus:border-[#159DB3] text-gray-900 font-medium"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Enter the date this session actually took place</p>
                                </div>
                            )}
                        </div>

                        {/* Program Selection */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg font-bold text-gray-900">
                                Select programs to run this session
                            </h3>
                            {clientPrograms.length > 0 && (
                                <button
                                    onClick={handleSelectAll}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 hover:shadow-md"
                                    style={{
                                        backgroundColor: selectedPrograms.length === clientPrograms.length ? '#E0F4F7' : '#F9FAFB',
                                        borderColor: selectedPrograms.length === clientPrograms.length ? '#159DB3' : '#E5E7EB',
                                        color: selectedPrograms.length === clientPrograms.length ? '#159DB3' : '#6B7280',
                                    }}
                                >
                                    {selectedPrograms.length === clientPrograms.length
                                        ? <><CheckSquare size={18} /> Deselect All</>
                                        : <><Square size={18} /> Select All</>
                                    }
                                </button>
                            )}
                        </div>

                        {clientPrograms.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <Target size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 mb-4">No programs found for this client</p>
                                <Button onClick={() => navigate(`/clients/${selectedClient.id}/programs/new`)}>
                                    Create Program
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {clientPrograms.map(program => {
                                    const isSelected = selectedPrograms.includes(program.id)
                                    const isSkill = program.program_type === 'skill'

                                    return (
                                        <button
                                            key={program.id}
                                            onClick={() => toggleProgram(program.id)}
                                            className={`w-full bg-white rounded-2xl border-2 p-5 transition-all text-left flex items-center justify-between ${isSelected
                                                ? 'border-[#159DB3] shadow-md'
                                                : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSkill
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-pink-50 text-pink-600'
                                                    }`}>
                                                    {isSkill ? <Target size={24} /> : <Activity size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${isSkill
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-pink-100 text-pink-700'
                                                            }`}>
                                                            {isSkill ? 'Skill' : 'Behavior'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 uppercase">
                                                            {program.data_type}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-heading text-lg font-bold text-gray-900">
                                                        {program.name}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? 'bg-[#159DB3] border-[#159DB3]'
                                                : 'border-gray-300'
                                                }`}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Start Session Button */}
                        {clientPrograms.length > 0 && (
                            <button
                                onClick={handleStartSession}
                                disabled={selectedPrograms.length === 0}
                                className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-xl font-heading font-bold transition-all ${selectedPrograms.length > 0
                                    ? 'bg-[#159DB3] text-white hover:bg-[#0E8499] shadow-lg hover:shadow-xl'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Play size={24} />
                                Start Session ({selectedPrograms.length} program{selectedPrograms.length !== 1 ? 's' : ''})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
