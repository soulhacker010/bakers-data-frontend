import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Calendar,
    FileText
} from 'lucide-react'

const sidebarLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/programs', label: 'Programs', icon: FolderKanban },
    { path: '/sessions', label: 'Sessions', icon: Calendar },
    { path: '/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
    const location = useLocation()

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-60 bg-gray-50 border-r border-gray-200 py-6 px-4 hidden lg:block">
            <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.path ||
                        (link.path !== '/dashboard' && location.pathname.startsWith(link.path))

                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary-light text-primary'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={20} />
                            {link.label}
                        </NavLink>
                    )
                })}
            </nav>
        </aside>
    )
}
