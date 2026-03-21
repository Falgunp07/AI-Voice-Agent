'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Users,
    Phone,
    Building2,
    Megaphone,
    TrendingUp,
    Clock,
    Zap,
    Activity,
} from 'lucide-react';

interface Stats {
    totalLeads: number;
    totalCalls: number;
    totalProperties: number;
    totalCampaigns: number;
    activeCampaigns: number;
    completedCalls: number;
    avgCallDuration: number;
    positiveRate: number;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<Stats>({
        totalLeads: 0, totalCalls: 0, totalProperties: 0, totalCampaigns: 0,
        activeCampaigns: 0, completedCalls: 0, avgCallDuration: 0, positiveRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentCalls, setRecentCalls] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            const supabase = createSupabaseBrowserClient();

            const [leads, calls, properties, campaigns] = await Promise.all([
                supabase.from('leads').select('id', { count: 'exact', head: true }),
                supabase.from('call_logs').select('*'),
                supabase.from('properties').select('id', { count: 'exact', head: true }),
                supabase.from('campaigns').select('*'),
            ]);

            const callData = calls.data || [];
            const campaignData = campaigns.data || [];
            const completedCalls = callData.filter(c => c.status === 'completed');
            const avgDuration = callData.length > 0
                ? Math.round(callData.reduce((a, c) => a + (c.duration || 0), 0) / callData.length)
                : 0;
            const positiveCalls = callData.filter(c => c.sentiment === 'positive').length;
            const positiveRate = completedCalls.length > 0
                ? Math.round((positiveCalls / completedCalls.length) * 100)
                : 0;

            setStats({
                totalLeads: leads.count || 0,
                totalCalls: callData.length,
                totalProperties: properties.count || 0,
                totalCampaigns: campaignData.length,
                activeCampaigns: campaignData.filter(c => c.status === 'active').length,
                completedCalls: completedCalls.length,
                avgCallDuration: avgDuration,
                positiveRate,
            });

            // Recent calls
            const { data: recent } = await supabase
                .from('call_logs')
                .select('*, leads(name, phone)')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentCalls(recent || []);
            setLoading(false);
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Leads', value: stats.totalLeads, icon: Users, gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
        { label: 'Total Calls', value: stats.totalCalls, icon: Phone, gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
        { label: 'Properties', value: stats.totalProperties, icon: Building2, gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
        { label: 'Campaigns', value: stats.totalCampaigns, icon: Megaphone, gradient: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400' },
        { label: 'Positive Rate', value: `${stats.positiveRate}%`, icon: TrendingUp, gradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
        { label: 'Avg Duration', value: `${stats.avgCallDuration}s`, icon: Clock, gradient: 'from-amber-500/20 to-yellow-500/20', iconColor: 'text-amber-400' },
        { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Zap, gradient: 'from-rose-500/20 to-orange-500/20', iconColor: 'text-rose-400' },
        { label: 'Completed Calls', value: stats.completedCalls, icon: Activity, gradient: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-400' },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-20 mb-3" />
                            <div className="h-7 bg-slate-800 rounded w-12" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
                <p className="text-slate-400 text-sm mt-1">System-wide statistics and health</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-5`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-400 text-xs font-medium">{card.label}</p>
                            <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                        </div>
                        <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Calls */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="font-semibold mb-4">Recent Calls</h3>
                {recentCalls.length === 0 ? (
                    <p className="text-slate-500 text-sm">No calls yet</p>
                ) : (
                    <div className="space-y-3">
                        {recentCalls.map((call, i) => (
                            <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${call.sentiment === 'positive' ? 'bg-emerald-400' :
                                        call.sentiment === 'negative' ? 'bg-red-400' : 'bg-yellow-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{call.leads?.name || 'Unknown'}</p>
                                    <p className="text-xs text-slate-500">{call.leads?.phone || ''}</p>
                                </div>
                                <span className="text-xs text-slate-400">{call.duration}s</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${call.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                        call.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                                    }`}>{call.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
