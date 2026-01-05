import Header from './Header'

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#F8FAFB]">
            <Header />
            <main className="pt-16">
                {children}
            </main>
        </div>
    )
}
