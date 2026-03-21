'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    PhoneCall,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Smile,
    Meh,
    Frown,
    Users,
} from 'lucide-react';

interface Analytics {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    noAnswer: number;
    avgDuration: number;
    conversionRate: number;
    sentiment: { positive: number; neutral: number; negative: number };
    leadFunnel: { new: number; contacted: number; interested: number; not_interested: number; callback: number };
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const supabase = createSupabaseBrowserClient();

            // Call stats
            const { data: calls } = await supabase.from('call_logs').select('*');
            const callList = calls || [];

            const totalCalls = callList.length;
            const successfulCalls = callList.filter(c => c.status === 'completed').length;
            const failedCalls = callList.filter(c => c.status === 'failed').length;
            const noAnswer = callList.filter(c => c.status === 'no_answer').length;
            const avgDuration = totalCalls > 0
                ? Math.round(callList.reduce((s, c) => s + (c.duration || 0), 0) / totalCalls)
                : 0;

            // Sentiment
            const positive = callList.filter(c => c.sentiment === 'positive').length;
            const neutral = callList.filter(c => c.sentiment === 'neutral').length;
            const negative = callList.filter(c => c.sentiment === 'negative').length;

            // Lead funnel
            const { data: leads } = await supabase.from('leads').select('status');
            const leadList = leads || [];
            const leadFunnel = {
                new: leadList.filter(l => l.status === 'new').length,
                contacted: leadList.filter(l => l.status === 'contacted').length,
                interested: leadList.filter(l => l.status === 'interested').length,
                not_interested: leadList.filter(l => l.status === 'not_interested').length,
                callback: leadList.filter(l => l.status === 'callback').length,
            };

            setAnalytics({
                totalCalls,
                successfulCalls,
                failedCalls,
                noAnswer,
                avgDuration,
                conversionRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
                sentiment: { positive, neutral, negative },
                leadFunnel,
            });
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

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

    if (!analytics) return null;

    const callCards = [
        { label: 'Total Calls', value: analytics.totalCalls, icon: PhoneCall, color: 'indigo' },
        { label: 'Successful', value: analytics.successfulCalls, icon: CheckCircle2, color: 'emerald' },
        { label: 'Failed / No Answer', value: analytics.failedCalls + analytics.noAnswer, icon: XCircle, color: 'red' },
        { label: 'Avg Duration', value: `${analytics.avgDuration}s`, icon: Clock, color: 'purple' },
    ];

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    };

    const totalSentiment = analytics.sentiment.positive + analytics.sentiment.neutral + analytics.sentiment.negative;
    const totalFunnel = Object.values(analytics.leadFunnel).reduce((a, b) => a + b, 0);

    const funnelStages = [
        { label: 'New', value: analytics.leadFunnel.new, color: 'bg-blue-500' },
        { label: 'Contacted', value: analytics.leadFunnel.contacted, color: 'bg-yellow-500' },
        { label: 'Interested', value: analytics.leadFunnel.interested, color: 'bg-emerald-500' },
        { label: 'Not Interested', value: analytics.leadFunnel.not_interested, color: 'bg-red-500' },
        { label: 'Callback', value: analytics.leadFunnel.callback, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                <p className="text-slate-400 text-sm mt-1">Track your call performance and lead conversions.</p>
            </div>

            {/* Call Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {callCards.map((card, i) => {
                    const colors = colorMap[card.color];
                    return (
                        <div key={i} className={`rounded-2xl border ${colors.border} bg-slate-900/50 p-6`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-slate-400">{card.label}</span>
                                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                    <card.icon className={`w-5 h-5 ${colors.text}`} />
                                </div>
                            </div>
                            <p className="text-3xl font-bold">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Rate */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-semibold mb-6">Conversion Rate</h3>
                    <div className="flex items-center justify-center">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(30 41 59)" strokeWidth="10" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(analytics.conversionRate / 100) * 314} 314`}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#22d3ee" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold">{analytics.conversionRate}%</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-slate-400 text-sm mt-4">
                        {analytics.successfulCalls} successful out of {analytics.totalCalls} calls
                    </p>
                </div>

                {/* Sentiment Breakdown */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                    <h3 className="text-lg font-semibold mb-6">Call Sentiment</h3>
                    {totalSentiment === 0 ? (
                        <div className="text-center py-8">
                            <Meh className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No sentiment data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[
                                { label: 'Positive', value: analytics.sentiment.positive, icon: Smile, color: 'emerald' },
                                { label: 'Neutral', value: analytics.sentiment.neutral, icon: Meh, color: 'yellow' },
                                { label: 'Negative', value: analytics.sentiment.negative, icon: Frown, color: 'red' },
                            ].map((item) => {
                                const pct = totalSentiment > 0 ? Math.round((item.value / totalSentiment) * 100) : 0;
                                return (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                                                <span className="text-slate-300">{item.label}</span>
                                            </div>
                                            <span className="text-slate-400">{item.value} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-${item.color}-500 transition-all duration-500`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Funnel */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold">Lead Funnel</h3>
                    <span className="text-sm text-slate-500 ml-auto">{totalFunnel} total leads</span>
                </div>
                {totalFunnel === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">No leads to display. Upload leads to see the funnel.</p>
                ) : (
                    <div className="space-y-3">
                        {funnelStages.map((stage) => {
                            const pct = totalFunnel > 0 ? Math.round((stage.value / totalFunnel) * 100) : 0;
                            return (
                                <div key={stage.label} className="flex items-center gap-4">
                                    <span className="text-sm text-slate-400 w-32 text-right">{stage.label}</span>
                                    <div className="flex-1 h-8 rounded-lg bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-700`}
                                            style={{ width: `${Math.max(pct, 5)}%` }}
                                        >
                                            <span className="text-xs font-medium text-white">{stage.value}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-500 w-12">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
