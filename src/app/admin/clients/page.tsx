'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Users, Phone, Building2, Search } from 'lucide-react';

interface ClientData {
    email: string;
    name: string;
    leadsCount: number;
    callsCount: number;
    propertiesCount: number;
    lastActive: string;
}

export default function ClientsPage() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [clients, setClients] = useState<ClientData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createSupabaseBrowserClient();

            // Get users from auth
            const { data: leads } = await supabase.from('leads').select('*');
            const { data: calls } = await supabase.from('call_logs').select('*');
            const { data: properties } = await supabase.from('properties').select('*');

            // For now, show a platform summary since we don't have multi-tenant yet
            const mockClients: ClientData[] = [
                {
                    email: 'admin@propcall.ai',
                    name: 'PropCall Admin',
                    leadsCount: leads?.length || 0,
                    callsCount: calls?.length || 0,
                    propertiesCount: properties?.length || 0,
                    lastActive: new Date().toISOString(),
                },
            ];

            setClients(mockClients);
            setLoading(false);
        };

        fetchData();
    }, []);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                    <p className="text-slate-400 text-sm mt-1">{clients.length} registered clients</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-800 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((client, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xs font-bold">
                                                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{client.name}</p>
                                                <p className="text-xs text-slate-500">{client.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-sm text-slate-300">
                                            <Users className="w-3.5 h-3.5 text-slate-500" />
                                            {client.leadsCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-sm text-slate-300">
                                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                                            {client.callsCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-sm text-slate-300">
                                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                            {client.propertiesCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(client.lastActive).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
