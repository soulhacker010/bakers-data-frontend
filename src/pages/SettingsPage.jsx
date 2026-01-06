import { useState } from 'react'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Select, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { LogOut, Check } from 'lucide-react'

const settingsNav = [
    { id: 'account', label: 'Account Settings', description: 'Personal details, email, password' },
    { id: 'notifications', label: 'Notifications', description: 'Email and push preferences' },
    { id: 'therapy', label: 'Therapy Defaults', description: 'Default session and program settings' },
    { id: 'data', label: 'Data & Export', description: 'Export your data, privacy controls' },
]

const roleOptions = [
    { value: 'Therapist', label: 'Therapist' },
    { value: 'BCBA', label: 'BCBA' },
    { value: 'RBT', label: 'RBT' },
    { value: 'Supervisor', label: 'Supervisor' },
]

function AccountSettings({ user }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        role: 'Therapist'
    })
    const [saved, setSaved] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setSaved(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Saving:', formData)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div>
            <p className="label-uppercase mb-2">A C C O U N T &nbsp; S E T T I N G S</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Personal information
            </h2>
            <p className="text-gray-500 mb-8">
                Your profile details for the Data Sirena platform.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <Input
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                />

                <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <Select
                    label="Role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    options={roleOptions}
                    placeholder=""
                />

                <Button type="submit" icon={saved ? <Check size={18} /> : null}>
                    {saved ? 'Saved!' : 'Update Details'}
                </Button>
            </form>
        </div>
    )
}

function TherapySettings() {
    const [settings, setSettings] = useState({
        defaultSessionDuration: 60,
        defaultMasteryCriteria: 80,
        autoSaveInterval: 30,
        showPromptLevels: true
    })

    return (
        <div>
            <p className="label-uppercase mb-2">T H E R A P Y &nbsp; D E F A U L T S</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Session & Program Defaults
            </h2>
            <p className="text-gray-500 mb-8">
                Configure default settings for new therapy sessions and programs.
            </p>

            <div className="space-y-6 max-w-xl">
                <Input
                    label="Default Session Duration (minutes)"
                    type="number"
                    value={settings.defaultSessionDuration}
                    onChange={(e) => setSettings({ ...settings, defaultSessionDuration: e.target.value })}
                />

                <Input
                    label="Default Mastery Criteria (%)"
                    type="number"
                    value={settings.defaultMasteryCriteria}
                    onChange={(e) => setSettings({ ...settings, defaultMasteryCriteria: e.target.value })}
                />

                <Input
                    label="Auto-save Interval (seconds)"
                    type="number"
                    value={settings.autoSaveInterval}
                    onChange={(e) => setSettings({ ...settings, autoSaveInterval: e.target.value })}
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-medium text-gray-900">Show Prompt Levels</p>
                        <p className="text-sm text-gray-500">Display prompt level options during data collection</p>
                    </div>
                    <button
                        onClick={() => setSettings({ ...settings, showPromptLevels: !settings.showPromptLevels })}
                        className={`w-12 h-6 rounded-full transition-colors ${settings.showPromptLevels ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.showPromptLevels ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </button>
                </div>

                <Button>Save Defaults</Button>
            </div>
        </div>
    )
}

function DataSettings() {
    return (
        <div>
            <p className="label-uppercase mb-2">D A T A &nbsp; && &nbsp; E X P O R T</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Data & Export Options
            </h2>
            <p className="text-gray-500 mb-8">
                Export your data or manage privacy settings.
            </p>

            <div className="space-y-6 max-w-xl">
                <Card className="p-6">
                    <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Export All Data</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Download all your clients, programs, and session data as a CSV file.
                    </p>
                    <Button variant="outline">Export to CSV</Button>
                </Card>

                <Card className="p-6">
                    <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Session Reports</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Generate detailed session reports for billing or documentation.
                    </p>
                    <Button variant="outline">Generate Reports</Button>
                </Card>
            </div>
        </div>
    )
}

function NotificationSettings() {
    const [prefs, setPrefs] = useState({
        emailNotifications: true,
        sessionReminders: true,
        progressAlerts: false
    })

    return (
        <div>
            <p className="label-uppercase mb-2">N O T I F I C A T I O N S</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Notification Preferences
            </h2>
            <p className="text-gray-500 mb-8">
                Control how and when you receive notifications.
            </p>

            <div className="space-y-4 max-w-xl">
                {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'sessionReminders', label: 'Session Reminders', desc: 'Get reminded before scheduled sessions' },
                    { key: 'progressAlerts', label: 'Progress Alerts', desc: 'Notify when clients reach mastery criteria' },
                ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <button
                            onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key] })}
                            className={`w-12 h-6 rounded-full transition-colors ${prefs[item.key] ? 'bg-primary' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const { user, logout } = useAuth()
    const [activeSection, setActiveSection] = useState('account')

    return (
        <DashboardLayout>
            <div className="px-6 py-8 max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="p-6">
                            <p className="label-uppercase mb-2">S E T T I N G S</p>
                            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">
                                Manage your Data Sirena account
                            </h2>

                            <nav className="space-y-1">
                                {settingsNav.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full text-left py-3 transition-colors ${activeSection === item.id
                                            ? 'text-primary font-semibold'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <p className={`text-sm font-medium ${activeSection === item.id ? 'text-primary' : 'text-gray-700'}`}>
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                                    </button>
                                ))}
                            </nav>

                            <div className="border-t border-gray-100 mt-6 pt-6">
                                <Button
                                    variant="ghost"
                                    onClick={logout}
                                    icon={<LogOut size={16} />}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    Sign out
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {activeSection === 'account' && <AccountSettings user={user} />}
                        {activeSection === 'notifications' && <NotificationSettings />}
                        {activeSection === 'therapy' && <TherapySettings />}
                        {activeSection === 'data' && <DataSettings />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
