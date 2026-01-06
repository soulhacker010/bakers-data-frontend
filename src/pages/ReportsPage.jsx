import { DashboardLayout } from '../components/layout'
import { Button } from '../components/ui'
import { Download, FileText, BarChart3, Calendar, Users, ArrowRight } from 'lucide-react'

export default function ReportsPage() {
    const reportTypes = [
        {
            icon: FileText,
            title: 'Session Summary',
            description: 'Generate a summary report of all sessions for a date range.',
            buttonText: 'Generate Report',
            variant: 'primary'
        },
        {
            icon: BarChart3,
            title: 'Progress Report',
            description: 'Client progress report with graphs and statistics.',
            buttonText: 'Generate Report',
            variant: 'primary'
        },
        {
            icon: Users,
            title: 'Client Report',
            description: 'Comprehensive report for a specific client.',
            buttonText: 'Select Client',
            variant: 'primary'
        },
        {
            icon: Calendar,
            title: 'Monthly Summary',
            description: 'Overview of all activities for a specific month.',
            buttonText: 'Select Month',
            variant: 'primary'
        },
        {
            icon: Download,
            title: 'Export All Data',
            description: 'Export all data to CSV for external analysis.',
            buttonText: 'Export CSV',
            variant: 'outline'
        }
    ]

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="hero-gradient px-6 py-10">
                <div className="max-w-screen-xl mx-auto">
                    <p className="label-uppercase-light mb-2">R E P O R T S</p>
                    <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
                        Reports & Exports
                    </h1>
                    <p className="text-white/70">
                        Generate reports and export your data
                    </p>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportTypes.map((report, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-[#159DB3]/20 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-xl bg-[#E0F4F7] text-[#159DB3] flex items-center justify-center mb-4 group-hover:bg-[#159DB3] group-hover:text-white transition-colors">
                                <report.icon size={28} />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 group-hover:text-[#159DB3] transition-colors">
                                {report.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                {report.description}
                            </p>
                            <Button variant={report.variant} size="sm" className="group/btn">
                                {report.buttonText}
                                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
