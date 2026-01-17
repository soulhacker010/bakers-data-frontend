import { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout'
import { Button, Input, Select, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { LogOut, Check, Download, FileText, Loader2, Shield, Smartphone, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    getUserSettings,
    updateUserSettings,
    updateUserProfile,
    downloadDataExport
} from '../services/settings'
import {
    toggleOTP,
    getTrustedDevices,
    removeTrustedDevice,
    removeAllTrustedDevices
} from '../services/auth'

const settingsNav = [
    { id: 'account', label: 'Account Settings', description: 'Personal details, email, password' },
    { id: 'security', label: 'Security', description: 'Two-factor authentication, trusted devices' },
    { id: 'notifications', label: 'Notifications', description: 'In-app notification preferences' },
    { id: 'therapy', label: 'Therapy Defaults', description: 'Default session and program settings' },
    { id: 'data', label: 'Data & Export', description: 'Export your data, privacy controls' },
]

const roleOptions = [
    { value: 'BCBA', label: 'BCBA (Board Certified Behavior Analyst)' },
    { value: 'RBT', label: 'RBT (Registered Behavior Technician)' },
    { value: 'Therapist', label: 'Therapist' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Other', label: 'Other' },
]

function AccountSettings({ user, toast, setUser }) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        role: user?.role || 'Therapist'
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setSaved(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const result = await updateUserProfile({
                full_name: formData.full_name,
                email: formData.email,
                role: formData.role
            })
            // Update auth context with new user data
            setUser(result)
            setSaved(true)
            toast.success('Profile updated successfully!')
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error('Profile update error:', err)
            toast.error(err.response?.data?.detail || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
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

                <Button type="submit" disabled={saving} icon={saved ? <Check size={18} /> : null}>
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Update Details'}
                </Button>
            </form>
        </div>
    )
}

function SecuritySettings({ user, toast, setUser }) {
    const [otpEnabled, setOtpEnabled] = useState(user?.otp_enabled || false)
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(false)

    useEffect(() => {
        loadDevices()
    }, [])

    const loadDevices = async () => {
        try {
            const data = await getTrustedDevices()
            setDevices(data)
        } catch (err) {
            console.error('Failed to load devices:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleOTP = async () => {
        setToggling(true)
        try {
            const result = await toggleOTP()
            const newStatus = !otpEnabled
            setOtpEnabled(newStatus)
            // Update user context
            if (setUser && user) {
                setUser({ ...user, otp_enabled: newStatus })
            }
            toast.success(result.message)
            // If disabled, devices are cleared server-side
            if (!newStatus) {
                setDevices([])
            }
        } catch (err) {
            toast.error(err.message || 'Failed to toggle 2FA')
        } finally {
            setToggling(false)
        }
    }

    const handleRemoveDevice = async (deviceId) => {
        try {
            await removeTrustedDevice(deviceId)
            setDevices(devices.filter(d => d.id !== deviceId))
            toast.success('Device removed')
        } catch (err) {
            toast.error(err.message || 'Failed to remove device')
        }
    }

    const handleRemoveAllDevices = async () => {
        if (!window.confirm('Remove all trusted devices? You will need to verify OTP on your next login.')) return
        try {
            await removeAllTrustedDevices()
            setDevices([])
            toast.success('All devices removed')
        } catch (err) {
            toast.error(err.message || 'Failed to remove devices')
        }
    }

    return (
        <div>
            <p className="label-uppercase mb-2">S E C U R I T Y</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Two-Factor Authentication
            </h2>
            <p className="text-gray-500 mb-8">
                Add an extra layer of security to your account by requiring a code sent to your email.
            </p>

            {/* 2FA Toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${otpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {otpEnabled ? <ShieldCheck className="text-green-600" size={24} /> : <ShieldOff className="text-gray-400" size={24} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Email Verification</h3>
                            <p className="text-sm text-gray-500">
                                {otpEnabled
                                    ? 'A 6-digit code will be sent to your email on new devices'
                                    : 'Enable to require verification on new devices'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleOTP}
                        disabled={toggling}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${otpEnabled ? 'bg-primary' : 'bg-gray-200'
                            } ${toggling ? 'opacity-50' : ''}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${otpEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Trusted Devices */}
            {otpEnabled && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-gray-900">Trusted Devices</h3>
                            <p className="text-sm text-gray-500">Devices that can skip email verification</p>
                        </div>
                        {devices.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveAllDevices}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={14} className="mr-1" /> Remove All
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Smartphone size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No trusted devices yet</p>
                            <p className="text-xs mt-1">Check "Remember this device" when logging in</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {devices.map(device => (
                                <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Smartphone size={20} className="text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{device.device_name || 'Unknown Device'}</p>
                                            <p className="text-xs text-gray-400">
                                                Last used: {new Date(device.last_used_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDevice(device.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove device"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TherapySettings({ toast }) {
    const [settings, setSettings] = useState({
        default_session_duration: 60,
        default_mastery_criteria: 80,
        default_mastery_sessions: 3,
        auto_save_interval: 30,
        show_prompt_levels: true
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getUserSettings()
                setSettings(prev => ({ ...prev, ...data }))
            } catch (err) {
                console.error('Failed to load settings:', err)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateUserSettings({
                default_session_duration: settings.default_session_duration,
                default_mastery_criteria: settings.default_mastery_criteria,
                default_mastery_sessions: settings.default_mastery_sessions,
                auto_save_interval: settings.auto_save_interval,
                show_prompt_levels: settings.show_prompt_levels
            })
            toast.success('Therapy defaults saved!')
        } catch (err) {
            toast.error(err.message || 'Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

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
                    value={settings.default_session_duration}
                    onChange={(e) => setSettings({ ...settings, default_session_duration: parseInt(e.target.value) || 60 })}
                />

                <Input
                    label="Default Mastery Criteria (%)"
                    type="number"
                    value={settings.default_mastery_criteria}
                    onChange={(e) => setSettings({ ...settings, default_mastery_criteria: parseInt(e.target.value) || 80 })}
                />

                <Input
                    label="Consecutive Sessions for Mastery"
                    type="number"
                    value={settings.default_mastery_sessions}
                    onChange={(e) => setSettings({ ...settings, default_mastery_sessions: parseInt(e.target.value) || 3 })}
                />

                <Input
                    label="Auto-save Interval (seconds)"
                    type="number"
                    value={settings.auto_save_interval}
                    onChange={(e) => setSettings({ ...settings, auto_save_interval: parseInt(e.target.value) || 30 })}
                />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-medium text-gray-900">Show Prompt Levels</p>
                        <p className="text-sm text-gray-500">Display prompt level options during data collection</p>
                    </div>
                    <button
                        onClick={() => setSettings({ ...settings, show_prompt_levels: !settings.show_prompt_levels })}
                        className={`w-12 h-6 rounded-full transition-colors ${settings.show_prompt_levels ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.show_prompt_levels ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </button>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Defaults'}
                </Button>
            </div>
        </div>
    )
}

function DataSettings({ toast }) {
    const [exporting, setExporting] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        try {
            await downloadDataExport()
            toast.success('Data exported successfully!')
        } catch (err) {
            toast.error(err.message || 'Failed to export data')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div>
            <p className="label-uppercase mb-2">D A T A &nbsp; & &nbsp; E X P O R T</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Data & Export Options
            </h2>
            <p className="text-gray-500 mb-8">
                Export your data or manage privacy settings.
            </p>

            <div className="space-y-6 max-w-xl">
                <Card className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Download size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Export All Data</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Download all your clients, programs, and session data as a JSON file.
                            </p>
                            <Button variant="outline" onClick={handleExport} disabled={exporting}>
                                {exporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Exporting...
                                    </>
                                ) : (
                                    'Export to JSON'
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Session Reports</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Generate detailed session reports for billing or documentation.
                            </p>
                            <Button variant="outline" onClick={() => window.location.href = '/reports'}>
                                Go to Reports
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function NotificationSettings({ toast }) {
    const [prefs, setPrefs] = useState({
        notify_session_reminders: true,
        notify_progress_alerts: true,
        notify_mastery_achieved: true,
        email_notifications: false,
        email_weekly_digest: false
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getUserSettings()
                setPrefs(prev => ({ ...prev, ...data }))
            } catch (err) {
                console.error('Failed to load settings:', err)
            } finally {
                setLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleToggle = async (key) => {
        const newValue = !prefs[key]
        setPrefs({ ...prefs, [key]: newValue })

        try {
            await updateUserSettings({ [key]: newValue })
        } catch (err) {
            // Revert on error
            setPrefs({ ...prefs, [key]: !newValue })
            toast.error(err.message || 'Failed to update preference')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const notificationItems = [
        { key: 'notify_session_reminders', label: 'Session Reminders', desc: 'Get notified before scheduled sessions' },
        { key: 'notify_progress_alerts', label: 'Progress Alerts', desc: 'Notifications when clients make progress' },
        { key: 'notify_mastery_achieved', label: 'Mastery Notifications', desc: 'Notify when clients reach mastery criteria' },
    ]

    return (
        <div>
            <p className="label-uppercase mb-2">N O T I F I C A T I O N S</p>
            <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                Notification Preferences
            </h2>
            <p className="text-gray-500 mb-8">
                Control how and when you receive notifications.
            </p>

            <div className="space-y-6 max-w-xl">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">In-App Notifications</h3>
                    <div className="space-y-3">
                        {notificationItems.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-900">{item.label}</p>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle(item.key)}
                                    className={`w-12 h-6 rounded-full transition-colors ${prefs[item.key] ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SettingsPage() {
    const { user, logout, setUser } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()
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

                            <div className="border-t border-gray-100 mt-6 pt-6 space-y-3">
                                {/* Admin Panel Button - Only visible to admin */}
                                {user?.is_admin && (
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/admin')}
                                        icon={<Shield size={16} />}
                                        className="w-full justify-start text-purple-600 border-purple-300 hover:bg-purple-50"
                                    >
                                        Admin Panel
                                    </Button>
                                )}
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
                        {activeSection === 'account' && <AccountSettings user={user} toast={toast} setUser={setUser} />}
                        {activeSection === 'security' && <SecuritySettings user={user} toast={toast} setUser={setUser} />}
                        {activeSection === 'notifications' && <NotificationSettings toast={toast} />}
                        {activeSection === 'therapy' && <TherapySettings toast={toast} />}
                        {activeSection === 'data' && <DataSettings toast={toast} />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
