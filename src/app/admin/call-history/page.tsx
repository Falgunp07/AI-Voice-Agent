'use client';
import { useState, useEffect } from 'react';
import {
    Phone,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Trash2,
    MessageSquare,
    Loader2,
    PhoneCall,
    Calendar,
} from 'lucide-react';

interface TranscriptEntry {
    role: 'user' | 'assistant';
    content: string;
    time: string;
}

interface CallRecord {
    id: string;
    caller_name: string;
    session_id: string;
    duration: number;
    transcript: TranscriptEntry[];
    message_count: number;
    status: string;
    created_at: string;
}

export default function CallHistoryPage() {
    const [calls, setCalls] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchCalls = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/ai-calls');
            const data = await res.json();
            if (data.success) {
                setCalls(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch calls:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    const deleteCall = async (id: string) => {
        if (!confirm('Delete this call record?')) return;
        try {
            await fetch(`http://localhost:4000/api/ai-calls/${id}`, { method: 'DELETE' });
            setCalls(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
                            <PhoneCall className="w-6 h-6 text-green-400" />
                        </div>
                        Call History
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Saved voice call transcripts from AI Playground</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-4 h-4" />
                    {calls.length} call{calls.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Empty state */}
            {calls.length === 0 && (
                <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-2xl">
                    <Phone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-1">No calls yet</h3>
                    <p className="text-sm text-slate-500">Voice call transcripts will appear here after you make calls from the AI Playground.</p>
                </div>
            )}

            {/* Call Cards */}
            <div className="space-y-3">
                {calls.map((call) => {
                    const isExpanded = expandedId === call.id;
                    const transcriptEntries = Array.isArray(call.transcript) ? call.transcript : [];

                    return (
                        <div
                            key={call.id}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 transition-all"
                        >
                            {/* Card Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : call.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-base">{call.caller_name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(call.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDuration(call.duration)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {call.message_count || transcriptEntries.length} messages
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${call.status === 'completed'
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                                        }`}>
                                        {call.status}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteCall(call.id); }}
                                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-500" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Transcript */}
                            {isExpanded && (
                                <div className="border-t border-white/10 p-5 bg-white/[0.01]">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Full Transcript</p>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {transcriptEntries.map((entry, i) => (
                                            <div key={i} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : ''}`}>
                                                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${entry.role === 'user'
                                                        ? 'bg-indigo-500/15 border border-indigo-500/15 text-indigo-200'
                                                        : 'bg-orange-500/10 border border-orange-500/15 text-orange-200'
                                                    }`}>
                                                    <p className="text-[10px] font-semibold mb-1 opacity-50">
                                                        {entry.role === 'user' ? call.caller_name : 'Arjun'}
                                                    </p>
                                                    {entry.content}
                                                </div>
                                            </div>
                                        ))}
                                        {transcriptEntries.length === 0 && (
                                            <p className="text-sm text-slate-500 italic text-center py-4">No transcript data available</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
