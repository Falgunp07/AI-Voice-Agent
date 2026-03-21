'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Search,
    Upload,
    Trash2,
    Filter,
    ChevronDown,
    X,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Phone,
    Mail,
} from 'lucide-react';

interface Lead {
    id: string;
    name: string;
    phone: string;
    email: string;
    budget: string;
    location: string;
    status: string;
    lead_score: string;
    created_at: string;
}

const statusOptions = ['all', 'new', 'contacted', 'interested', 'not_interested', 'callback'];
const scoreOptions = ['all', 'hot', 'warm', 'cold'];

const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    interested: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    not_interested: 'bg-red-500/20 text-red-300 border-red-500/30',
    callback: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const scoreColors: Record<string, string> = {
    hot: 'bg-red-500/20 text-red-300',
    warm: 'bg-orange-500/20 text-orange-300',
    cold: 'bg-cyan-500/20 text-cyan-300',
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scoreFilter, setScoreFilter] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const fetchLeads = async () => {
        const supabase = createSupabaseBrowserClient();
        let query = supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        if (scoreFilter !== 'all') query = query.eq('lead_score', scoreFilter);

        const { data } = await query;
        setLeads(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLeads();
    }, [statusFilter, scoreFilter]);

    const handleDelete = async (id: string) => {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('leads').delete().eq('id', id);
        setLeads(leads.filter((l) => l.id !== id));
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const supabase = createSupabaseBrowserClient();
        await supabase
            .from('leads')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:4000/api/leads/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setUploadResult({ success: true, message: data.message });
                fetchLeads();
            } else {
                setUploadResult({ success: false, message: data.error });
            }
        } catch {
            setUploadResult({ success: false, message: 'Failed to connect to server. Is the backend running?' });
        }
        setUploading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const filteredLeads = leads.filter((lead) => {
        const matchesSearch =
            lead.name?.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.includes(search) ||
            lead.email?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Lead Management</h2>
                    <p className="text-slate-400 text-sm mt-1">{leads.length} total leads</p>
                </div>
                <button
                    onClick={() => { setShowUpload(true); setUploadResult(null); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                    <Upload className="w-4 h-4" />
                    Upload Excel
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone, or email..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                    {statusOptions.map((s) => (
                        <option key={s} value={s} className="bg-slate-900">
                            {s === 'all' ? 'All Status' : s.replace('_', ' ')}
                        </option>
                    ))}
                </select>
                <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                    {scoreOptions.map((s) => (
                        <option key={s} value={s} className="bg-slate-900">
                            {s === 'all' ? 'All Scores' : s}
                        </option>
                    ))}
                </select>
            </div>

            {/* Leads Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No leads found</p>
                        <p className="text-slate-500 text-sm mt-1">Upload an Excel file to add leads</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Contact</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Budget</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{lead.name}</p>
                                                    <p className="text-xs text-slate-500">{lead.location || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-slate-300">
                                                    <Phone className="w-3 h-3 text-slate-500" />
                                                    {lead.phone}
                                                </div>
                                                {lead.email && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                        <Mail className="w-3 h-3 text-slate-500" />
                                                        {lead.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{lead.budget || '—'}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none ${statusColors[lead.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}
                                            >
                                                {statusOptions.filter(s => s !== 'all').map((s) => (
                                                    <option key={s} value={s} className="bg-slate-900 text-white">
                                                        {s.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.lead_score ? (
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${scoreColors[lead.lead_score] || ''}`}>
                                                    {lead.lead_score}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                                                title="Delete lead"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Upload Leads</h3>
                            <button
                                onClick={() => setShowUpload(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragActive
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.xlsx,.xls,.csv';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleFileUpload(file);
                                };
                                input.click();
                            }}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    <p className="text-slate-300">Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <p className="text-slate-300 font-medium">Drop your Excel file here</p>
                                    <p className="text-slate-500 text-sm mt-1">or click to browse (.xlsx, .xls, .csv)</p>
                                </>
                            )}
                        </div>

                        {/* Upload Result */}
                        {uploadResult && (
                            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${uploadResult.success
                                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                {uploadResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                                <p className={`text-sm ${uploadResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {uploadResult.message}
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mt-4">
                            Excel columns: Name, Phone, Email, Budget, Location, Preferences
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
