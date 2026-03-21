'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Users, PhoneCall, TrendingUp, Megaphone, Upload, Building2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalLeads: number;
    totalCalls: number;
    conversionRate: number;
    activeCampaigns: number;
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<Stats>({
        totalLeads: 0,
        totalCalls: 0,
        conversionRate: 0,
        activeCampaigns: 0,
    });
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const fetchData = async () => {
            // Get user name
            const { data: { user } } = await supabase.auth.getUser();
            setUserName(user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');

            // Get leads count
            const { count: leadCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true });

            // Get calls count
            const { count: callCount } = await supabase
                .from('call_logs')
                .select('*', { count: 'exact', head: true });

            // Get successful calls
            const { count: successCount } = await supabase
                .from('call_logs')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            // Get active campaigns
            const { count: campaignCount } = await supabase
                .from('campaigns')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Get recent leads
            const { data: leads } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                totalLeads: leadCount || 0,
                totalCalls: callCount || 0,
                conversionRate: callCount ? Math.round(((successCount || 0) / callCount) * 100) : 0,
                activeCampaigns: campaignCount || 0,
            });
            setRecentLeads(leads || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    const statCards = [
        { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'indigo', change: '' },
        { label: 'Calls Made', value: stats.totalCalls, icon: PhoneCall, color: 'purple', change: '' },
        { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'emerald', change: '' },
        { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'cyan', change: '' },
    ];

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    };

    const statusColor: Record<string, string> = {
        new: 'bg-blue-500/20 text-blue-300',
        contacted: 'bg-yellow-500/20 text-yellow-300',
        interested: 'bg-emerald-500/20 text-emerald-300',
        not_interested: 'bg-red-500/20 text-red-300',
        callback: 'bg-purple-500/20 text-purple-300',
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-24 mb-4" />
                            <div className="h-8 bg-slate-800 rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Welcome back, {userName} 👋</h2>
                <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your campaigns.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => {
                    const colors = colorMap[card.color];
                    return (
                        <div
                            key={i}
                            className={`rounded-2xl border ${colors.border} bg-slate-900/50 backdrop-blur-md p-6 hover:border-opacity-50 transition-all duration-300 group`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-slate-400">{card.label}</span>
                                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <card.icon className={`w-5 h-5 ${colors.text}`} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions + Recent Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-all group"
                        >
                            <Upload className="w-5 h-5 text-indigo-400" />
                            <span className="text-sm font-medium">Upload Leads</span>
                            <ArrowUpRight className="w-4 h-4 ml-auto text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </Link>
                        <Link
                            href="/dashboard/properties"
                            className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all group"
                        >
                            <Building2 className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium">Add Property</span>
                            <ArrowUpRight className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-400 transition-colors" />
                        </Link>
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Leads</h3>
                        <Link href="/dashboard/leads" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            View all →
                        </Link>
                    </div>

                    {recentLeads.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No leads yet. Upload an Excel file to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentLeads.map((lead) => (
                                <div key={lead.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{lead.name}</p>
                                        <p className="text-xs text-slate-500">{lead.phone}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[lead.status] || 'bg-slate-500/20 text-slate-300'}`}>
                                        {lead.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
