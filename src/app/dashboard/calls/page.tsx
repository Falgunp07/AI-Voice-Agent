'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Phone,
    Clock,
    ChevronDown,
    ChevronUp,
    Smile,
    Meh,
    Frown,
    CheckCircle,
    XCircle,
    PhoneMissed,
    PhoneOff,
    Filter,
} from 'lucide-react';

interface CallLog {
    id: string;
    lead_id: string;
    duration: number;
    status: string;
    transcript: string;
    sentiment: string;
    created_at: string;
    leads?: { name: string; phone: string };
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
    no_answer: { icon: PhoneMissed, color: 'text-yellow-400', label: 'No Answer' },
    busy: { icon: PhoneOff, color: 'text-orange-400', label: 'Busy' },
};

const sentimentConfig: Record<string, { icon: typeof Smile; color: string; label: string }> = {
    positive: { icon: Smile, color: 'text-emerald-400', label: 'Positive' },
    neutral: { icon: Meh, color: 'text-yellow-400', label: 'Neutral' },
    negative: { icon: Frown, color: 'text-red-400', label: 'Negative' },
};

export default function CallsPage() {
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSentiment, setFilterSentiment] = useState('all');

    const fetchCalls = async () => {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
            .from('call_logs')
            .select('*, leads(name, phone)')
            .order('created_at', { ascending: false });
        setCalls(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCalls();
        const interval = setInterval(fetchCalls, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredCalls = calls.filter(call => {
        if (filterStatus !== 'all' && call.status !== filterStatus) return false;
        if (filterSentiment !== 'all' && call.sentiment !== filterSentiment) return false;
        return true;
    });

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Stats
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const avgDuration = totalCalls > 0
        ? Math.round(calls.reduce((a, c) => a + (c.duration || 0), 0) / totalCalls)
        : 0;
    const positiveRate = completedCalls > 0
        ? Math.round((calls.filter(c => c.sentiment === 'positive').length / completedCalls) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Call History</h2>
                <p className="text-slate-400 text-sm mt-1">{totalCalls} total calls</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Calls', value: totalCalls, color: 'from-indigo-500/20 to-purple-500/20' },
                    { label: 'Completed', value: completedCalls, color: 'from-emerald-500/20 to-cyan-500/20' },
                    { label: 'Avg Duration', value: formatDuration(avgDuration), color: 'from-amber-500/20 to-orange-500/20' },
                    { label: 'Positive Rate', value: `${positiveRate}%`, color: 'from-pink-500/20 to-rose-500/20' },
                ].map((stat, i) => (
                    <div key={i} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.color} p-4`}>
                        <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <div className="relative">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white appearance-none pr-8 cursor-pointer focus:outline-none focus:border-indigo-500/50"
                    >
                        <option value="all" className="bg-slate-900">All Status</option>
                        <option value="completed" className="bg-slate-900">Completed</option>
                        <option value="failed" className="bg-slate-900">Failed</option>
                        <option value="no_answer" className="bg-slate-900">No Answer</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                    <select
                        value={filterSentiment}
                        onChange={(e) => setFilterSentiment(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white appearance-none pr-8 cursor-pointer focus:outline-none focus:border-indigo-500/50"
                    >
                        <option value="all" className="bg-slate-900">All Sentiments</option>
                        <option value="positive" className="bg-slate-900">Positive</option>
                        <option value="neutral" className="bg-slate-900">Neutral</option>
                        <option value="negative" className="bg-slate-900">Negative</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Call Log List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse">
                            <div className="h-5 bg-slate-800 rounded w-48 mb-2" />
                            <div className="h-4 bg-slate-800 rounded w-32" />
                        </div>
                    ))}
                </div>
            ) : filteredCalls.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
                    <Phone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No calls yet</p>
                    <p className="text-slate-500 text-sm mt-1">Start a campaign to begin making calls</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredCalls.map(call => {
                        const isExpanded = expandedId === call.id;
                        const sCfg = statusConfig[call.status] || statusConfig.completed;
                        const sentCfg = sentimentConfig[call.sentiment] || sentimentConfig.neutral;
                        const StatusIcon = sCfg.icon;
                        const SentimentIcon = sentCfg.icon;

                        return (
                            <div
                                key={call.id}
                                className={`rounded-2xl border transition-all ${isExpanded ? 'border-indigo-500/30 bg-slate-900/80' : 'border-white/10 bg-slate-900/50'} overflow-hidden`}
                            >
                                {/* Row */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : call.id)}
                                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className={`p-2 rounded-xl ${call.status === 'completed' ? 'bg-emerald-500/10' : call.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                                        <StatusIcon className={`w-4 h-4 ${sCfg.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{(call.leads as any)?.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{(call.leads as any)?.phone || ''}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5">
                                        <SentimentIcon className={`w-4 h-4 ${sentCfg.color}`} />
                                        <span className={`text-xs ${sentCfg.color}`}>{sentCfg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatDuration(call.duration)}
                                    </div>
                                    <span className="text-xs text-slate-500 hidden md:block">
                                        {formatDate(call.created_at)}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>

                                {/* Expanded Transcript */}
                                {isExpanded && call.transcript && (
                                    <div className="px-5 pb-5 border-t border-white/5">
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-3">Call Transcript</h4>
                                        <div className="rounded-xl bg-slate-800/50 p-4 space-y-2 font-mono text-sm">
                                            {call.transcript.split('\n').map((line, i) => {
                                                const isAI = line.startsWith('AI:');
                                                const isLead = line.startsWith('Lead:');
                                                return (
                                                    <p key={i} className={`${isAI ? 'text-indigo-300' : isLead ? 'text-emerald-300' : 'text-slate-500 italic'}`}>
                                                        {line}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
