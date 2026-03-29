'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Activity,
    Bot,
    Menu,
    ChevronRight,
    Shield,
    History,
    CalendarCheck,
} from 'lucide-react';

const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Clients', href: '/admin/clients', icon: Users },
    { label: 'Usage', href: '/admin/usage', icon: Activity },
    { label: 'AI Playground', href: '/admin/ai-playground', icon: Bot },
    { label: 'Call History', href: '/admin/call-history', icon: History },
    { label: 'Appointments', href: '/admin/appointments', icon: CalendarCheck },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Don't render sidebar on login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/" className="text-xl font-bold tracking-tighter font-[family-name:var(--font-space)]">
                        PropCall<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">.ai</span>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-2">
                        <Shield className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400/80 uppercase tracking-wider">Admin Panel</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                {item.label}
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-orange-400" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to Dashboard */}
                <div className="p-4 border-t border-white/10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Merchant Panel
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold capitalize">
                        {navItems.find(item => item.href === pathname)?.label || 'Admin'}
                    </h1>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
