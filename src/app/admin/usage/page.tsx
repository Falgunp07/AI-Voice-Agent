'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Cpu,
    HardDrive,
    Clock,
    Phone,
    CheckCircle,
    XCircle,
    TrendingUp,
    BarChart3,
} from 'lucide-react';

export default function UsagePage() {
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState({
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        totalMinutes: 0,
        positiveSentiment: 0,
        neutralSentiment: 0,
        negativeSentiment: 0,
        totalLeads: 0,
        totalProperties: 0,
        totalCampaigns: 0,
    });

    useEffect(() => {
        const fetchUsage = async () => {
            const supabase = createSupabaseBrowserClient();

            const [calls, leads, properties, campaigns] = await Promise.all([
                supabase.from('call_logs').select('*'),
                supabase.from('leads').select('id', { count: 'exact', head: true }),
                supabase.from('properties').select('id', { count: 'exact', head: true }),
                supabase.from('campaigns').select('id', { count: 'exact', head: true }),
            ]);

            const callData = calls.data || [];
            const totalMinutes = Math.round(callData.reduce((a, c) => a + (c.duration || 0), 0) / 60 * 10) / 10;

            setUsage({
                totalCalls: callData.length,
                completedCalls: callData.filter(c => c.status === 'completed').length,
                failedCalls: callData.filter(c => c.status === 'failed' || c.status === 'no_answer').length,
                totalMinutes,
                positiveSentiment: callData.filter(c => c.sentiment === 'positive').length,
                neutralSentiment: callData.filter(c => c.sentiment === 'neutral').length,
                negativeSentiment: callData.filter(c => c.sentiment === 'negative').length,
                totalLeads: leads.count || 0,
                totalProperties: properties.count || 0,
                totalCampaigns: campaigns.count || 0,
            });

            setLoading(false);
        };

        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Usage & Monitoring</h2>
                <p className="text-slate-400 text-sm mt-1">Platform resource usage and system health</p>
            </div>

            {/* System Health */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-orange-400" />
                    System Health
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'API Server', status: 'Online', color: 'bg-emerald-400' },
                        { label: 'Database', status: 'Connected', color: 'bg-emerald-400' },
                        { label: 'Groq AI', status: 'Active', color: 'bg-emerald-400' },
                        { label: 'Twilio', status: 'Not Configured', color: 'bg-yellow-400' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className={`w-2.5 h-2.5 rounded-full ${item.color} animate-pulse`} />
                            <div>
                                <p className="text-xs text-slate-400">{item.label}</p>
                                <p className="text-sm font-medium">{item.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Call Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <p className="text-sm text-slate-400">Total Calls</p>
                    </div>
                    <p className="text-3xl font-bold">{usage.totalCalls}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> {usage.completedCalls} completed
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-3 h-3" /> {usage.failedCalls} failed
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <p className="text-sm text-slate-400">Call Minutes</p>
                    </div>
                    <p className="text-3xl font-bold">{usage.totalMinutes}</p>
                    <p className="text-xs text-slate-500 mt-3">Total minutes consumed</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <p className="text-sm text-slate-400">Conversion Rate</p>
                    </div>
                    <p className="text-3xl font-bold">
                        {usage.completedCalls > 0 ? Math.round((usage.positiveSentiment / usage.completedCalls) * 100) : 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-3">Positive call outcomes</p>
                </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    Sentiment Breakdown
                </h3>
                <div className="space-y-3">
                    {[
                        { label: 'Positive', count: usage.positiveSentiment, total: usage.totalCalls, color: 'bg-emerald-500' },
                        { label: 'Neutral', count: usage.neutralSentiment, total: usage.totalCalls, color: 'bg-yellow-500' },
                        { label: 'Negative', count: usage.negativeSentiment, total: usage.totalCalls, color: 'bg-red-500' },
                    ].map((item, i) => {
                        const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
                        return (
                            <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-slate-400">{item.count} ({pct}%)</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Resource Usage */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-400" />
                    Resource Usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-2xl font-bold">{usage.totalLeads}</p>
                        <p className="text-xs text-slate-400 mt-1">Leads Stored</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-2xl font-bold">{usage.totalProperties}</p>
                        <p className="text-xs text-slate-400 mt-1">Properties Listed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-2xl font-bold">{usage.totalCampaigns}</p>
                        <p className="text-xs text-slate-400 mt-1">Campaigns Created</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
