import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    Home,
    Users,
    FolderKanban,
    Calendar,
    FileText,
    Bell,
    Search,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { path: '/dashboard', label: 'HOME', icon: Home },
    { path: '/clients', label: 'CLIENTS', icon: Users },
    { path: '/programs', label: 'PROGRAMS', icon: FolderKanban },
    { path: '/sessions', label: 'SESSIONS', icon: Calendar },
    { path: '/reports', label: 'REPORTS', icon: FileText },
]

export default function Header() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [showMobileSearch, setShowMobileSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
    }

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
                <div className="h-full px-4 md:px-6 flex items-center justify-between max-w-screen-2xl mx-auto">
                    {/* Left: Mobile Menu Button + Logo */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setShowMobileMenu(true)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Logo on mobile */}
                        <Link to="/dashboard" className="md:hidden flex items-center">
                            <img src="/images/logo.png" alt="Data Sirena" className="h-8 w-auto rounded" />
                        </Link>

                        {/* Logo on desktop */}
                        <Link to="/dashboard" className="hidden md:flex items-center mr-4">
                            <img src="/images/logo.png" alt="Data Sirena" className="h-10 w-auto" />
                        </Link>

                        {/* Search - Desktop only */}
                        <div className="search-input-container w-48 hidden md:block">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Center: Navigation - Desktop only */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Search (mobile) + Notifications + User */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Search Icon */}
                        <button
                            onClick={() => setShowMobileSearch(true)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Search size={20} />
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                4
                            </span>
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                                    {getInitials(user?.full_name)}
                                </div>
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    ></div>
                                    <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-semibold text-gray-900">{user?.full_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/settings"
                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Account Settings
                                            </Link>
                                            <Link
                                                to="/help"
                                                className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Help & Support
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-100 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Search Overlay */}
            {showMobileSearch && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
                        onClick={() => setShowMobileSearch(false)}
                    ></div>
                    <div className="fixed top-0 left-0 right-0 bg-white z-50 md:hidden p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 search-input-container">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input w-full"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => setShowMobileSearch(false)}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Navigation Drawer */}
            {showMobileMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
                        onClick={() => setShowMobileMenu(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 md:hidden shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <img src="/images/logo.png" alt="Data Sirena" className="h-10 w-auto" />
                            <button
                                onClick={() => setShowMobileMenu(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path ||
                                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setShowMobileMenu(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Settings Link */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                            <Link
                                to="/settings"
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    setShowMobileMenu(false)
                                    handleLogout()
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={20} />
                                Sign out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
