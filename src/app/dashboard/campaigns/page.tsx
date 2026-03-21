'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Plus,
    X,
    Play,
    Pause,
    Trash2,
    Megaphone,
    ChevronDown,
    CheckCircle2,
    Clock,
    Users,
    Building2,
    Zap,
    Loader2,
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    property_id: string;
    status: string;
    total_leads: number;
    called_leads: number;
    successful_calls: number;
    created_at: string;
    properties?: { name: string; location: string };
}

interface Property {
    id: string;
    name: string;
    location: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: 'Draft' },
    active: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Active' },
    paused: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Paused' },
    completed: { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Completed' },
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [saving, setSaving] = useState(false);
    const [starting, setStarting] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', property_id: '' });
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    const fetchCampaigns = async () => {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
            .from('campaigns')
            .select('*, properties(name, location)')
            .order('created_at', { ascending: false });
        setCampaigns(data || []);
        setLoading(false);
    };

    const fetchFormData = async () => {
        const supabase = createSupabaseBrowserClient();
        const { data: props } = await supabase.from('properties').select('id, name, location');
        const { data: lds } = await supabase.from('leads').select('id, name, phone, status');
        setProperties(props || []);
        setLeads(lds || []);
    };

    useEffect(() => {
        fetchCampaigns();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchCampaigns, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                name: form.name,
                property_id: form.property_id || null,
                status: 'draft',
                total_leads: selectedLeads.length,
                called_leads: 0,
                successful_calls: 0,
            })
            .select()
            .single();

        if (data && !error) {
            // Insert campaign_leads associations
            if (selectedLeads.length > 0) {
                const associations = selectedLeads.map(lead_id => ({
                    campaign_id: data.id,
                    lead_id,
                    status: 'pending',
                }));
                await supabase.from('campaign_leads').insert(associations);
            }
        }

        setShowForm(false);
        setForm({ name: '', property_id: '' });
        setSelectedLeads([]);
        setSaving(false);
        fetchCampaigns();
    };

    const handleStart = async (id: string) => {
        setStarting(id);
        try {
            await fetch(`http://localhost:4000/api/campaigns/${id}/start`, { method: 'POST' });
            fetchCampaigns();
        } catch (err) {
            console.error('Failed to start campaign:', err);
        }
        setStarting(null);
    };

    const handlePause = async (id: string) => {
        const supabase = createSupabaseBrowserClient();
        await supabase
            .from('campaigns')
            .update({ status: 'paused', updated_at: new Date().toISOString() })
            .eq('id', id);
        fetchCampaigns();
    };

    const handleDelete = async (id: string) => {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('campaign_leads').delete().eq('campaign_id', id);
        await supabase.from('campaigns').delete().eq('id', id);
        setCampaigns(campaigns.filter(c => c.id !== id));
    };

    const toggleLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const selectAllLeads = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l.id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
                    <p className="text-slate-400 text-sm mt-1">{campaigns.length} campaigns total</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); fetchFormData(); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Create Campaign
                </button>
            </div>

            {/* Campaign Cards */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 animate-pulse">
                            <div className="h-5 bg-slate-800 rounded w-48 mb-3" />
                            <div className="h-4 bg-slate-800 rounded w-32" />
                        </div>
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-12 text-center">
                    <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No campaigns yet</p>
                    <p className="text-slate-500 text-sm mt-1">Create your first calling campaign</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {campaigns.map(campaign => {
                        const progress = campaign.total_leads > 0
                            ? Math.round((campaign.called_leads / campaign.total_leads) * 100)
                            : 0;
                        const statusCfg = statusConfig[campaign.status] || statusConfig.draft;

                        return (
                            <div key={campaign.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 hover:border-white/15 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </div>
                                        {campaign.properties && (
                                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                                <Building2 className="w-3.5 h-3.5" />
                                                {campaign.properties.name} — {campaign.properties.location}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {campaign.status === 'draft' && (
                                            <button
                                                onClick={() => handleStart(campaign.id)}
                                                disabled={starting === campaign.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-sm transition-all disabled:opacity-50"
                                            >
                                                {starting === campaign.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5" />
                                                )}
                                                Start
                                            </button>
                                        )}
                                        {campaign.status === 'active' && (
                                            <button
                                                onClick={() => handlePause(campaign.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 text-sm transition-all"
                                            >
                                                <Pause className="w-3.5 h-3.5" />
                                                Pause
                                            </button>
                                        )}
                                        {campaign.status === 'paused' && (
                                            <button
                                                onClick={() => handleStart(campaign.id)}
                                                disabled={starting === campaign.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-sm transition-all disabled:opacity-50"
                                            >
                                                {starting === campaign.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5" />
                                                )}
                                                Resume
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(campaign.id)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" /> {campaign.total_leads} leads
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> {campaign.successful_calls} successful
                                            </span>
                                        </div>
                                        <span className="text-slate-300 font-medium">{progress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${campaign.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Campaign Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Create Campaign</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            {/* Campaign Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Campaign Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Q1 Mumbai Outreach"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
                                />
                            </div>

                            {/* Select Property */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Property <span className="text-slate-500">(optional)</span></label>
                                <div className="relative">
                                    <select
                                        value={form.property_id}
                                        onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-900">No property</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id} className="bg-slate-900">{p.name} — {p.location}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Select Leads */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-300">Select Leads *</label>
                                    <button
                                        type="button"
                                        onClick={selectAllLeads}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                                {leads.length === 0 ? (
                                    <p className="text-sm text-slate-500 p-4 text-center border border-white/10 rounded-xl">No leads available. Upload leads first.</p>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                                        {leads.map(lead => (
                                            <label
                                                key={lead.id}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => toggleLead(lead.id)}
                                                    className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{lead.name}</p>
                                                    <p className="text-xs text-slate-500">{lead.phone}</p>
                                                </div>
                                                <span className="text-xs text-slate-500 capitalize">{lead.status}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 mt-2">{selectedLeads.length} leads selected</p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={saving || selectedLeads.length === 0}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Create Campaign
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
