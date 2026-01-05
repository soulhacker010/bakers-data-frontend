import { DashboardLayout } from '../components/layout'
import { Button, Card } from '../components/ui'
import { Download, FileText, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
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

            {/* Reports Options */}
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                            <FileText size={24} className="text-primary" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                            Session Summary
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Generate a summary report of all sessions for a date range.
                        </p>
                        <Button size="sm">Generate Report</Button>
                    </Card>

                    <Card className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                            <BarChart3 size={24} className="text-blue-600" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                            Progress Report
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Client progress report with graphs and statistics.
                        </p>
                        <Button size="sm">Generate Report</Button>
                    </Card>

                    <Card className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                            <Download size={24} className="text-green-600" />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                            Export Data
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Export all data to CSV for external analysis.
                        </p>
                        <Button variant="outline" size="sm">Export CSV</Button>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
