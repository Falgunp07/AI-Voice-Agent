'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    LayoutDashboard,
    Users,
    Building2,
    BarChart3,
    Megaphone,
    Phone,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ChevronRight,
    User as UserIcon,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', href: '/dashboard/leads', icon: Users },
    { label: 'Properties', href: '/dashboard/properties', icon: Building2 },
    { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { label: 'Calls', href: '/dashboard/calls', icon: Phone },
    { label: 'WhatsApp', href: '/dashboard/whatsapp', icon: MessageSquare },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    }, []);

    const handleLogout = async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const userEmail = user?.email || '';
    const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

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
                        PropCall<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.ai</span>
                    </Link>
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
                                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                {item.label}
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{userName}</p>
                            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
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
                        {pathname === '/dashboard' ? 'Merchant Panel' : navItems.find(item => item.href === pathname)?.label || 'Merchant Panel'}
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
