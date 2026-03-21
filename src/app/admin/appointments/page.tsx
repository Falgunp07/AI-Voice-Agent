'use client';
import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Building,
    Plus,
    X,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
    Edit3,
    StickyNote,
    CalendarCheck,
} from 'lucide-react';

interface Appointment {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    property_name: string;
    appointment_date: string;
    appointment_time: string;
    notes: string;
    status: string;
    source: string;
    created_at: string;
}

const emptyForm = {
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    property_name: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
};

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

    const fetchAppointments = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/appointments');
            const data = await res.json();
            if (data.success) setAppointments(data.data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    const createAppointment = async () => {
        if (!form.customer_name || !form.property_name || !form.appointment_date || !form.appointment_time) {
            alert('Please fill required fields: Name, Property, Date, Time');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('http://localhost:4000/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setAppointments(prev => [data.data, ...prev]);
                setShowModal(false);
                setForm(emptyForm);
            }
        } catch (err) {
            console.error('Create failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`http://localhost:4000/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm('Delete this appointment?')) return;
        try {
            await fetch(`http://localhost:4000/api/appointments/${id}`, { method: 'DELETE' });
            setAppointments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime12 = (timeStr: string) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
        scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
        completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
        cancelled: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
    };

    const counts = {
        all: appointments.length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
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
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
                            <CalendarCheck className="w-6 h-6 text-orange-400" />
                        </div>
                        Appointments
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Site visit bookings and scheduled appointments</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Appointment
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === tab
                                ? 'bg-white/10 text-white border border-white/15'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab} ({counts[tab]})
                    </button>
                ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-2xl">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400 mb-1">No appointments</h3>
                    <p className="text-sm text-slate-500">Click &quot;New Appointment&quot; to schedule a site visit.</p>
                </div>
            )}

            {/* Appointment Cards */}
            <div className="grid gap-4">
                {filtered.map(appt => {
                    const sc = statusConfig[appt.status] || statusConfig.scheduled;
                    const isUpcoming = new Date(appt.appointment_date + 'T' + appt.appointment_time) > new Date();

                    return (
                        <div
                            key={appt.id}
                            className={`bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/15 transition-all ${appt.status === 'cancelled' ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Left: Customer + Property */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sc.bg} border ${sc.border}`}>
                                        <User className={`w-5 h-5 ${sc.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-white font-semibold">{appt.customer_name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color} border ${sc.border}`}>
                                                {appt.status}
                                            </span>
                                            {isUpcoming && appt.status === 'scheduled' && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                                                    Upcoming
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Building className="w-3.5 h-3.5 text-orange-400" />
                                                {appt.property_name}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(appt.appointment_date)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTime12(appt.appointment_time)}
                                            </span>
                                            {appt.customer_phone && (
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {appt.customer_phone}
                                                </span>
                                            )}
                                            {appt.customer_email && (
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    {appt.customer_email}
                                                </span>
                                            )}
                                        </div>
                                        {appt.notes && (
                                            <div className="flex items-start gap-1.5 mt-2 text-sm text-slate-500">
                                                <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                <span className="italic">{appt.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {appt.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(appt.id, 'completed')}
                                                className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                                title="Mark Completed"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(appt.id, 'cancelled')}
                                                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Cancel"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => deleteAppointment(appt.id)}
                                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <CalendarCheck className="w-5 h-5 text-orange-400" />
                                New Appointment
                            </h3>
                            <button
                                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-5 space-y-4">
                            {/* Customer Name */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Customer Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={form.customer_name}
                                        onChange={e => setForm({ ...form, customer_name: e.target.value })}
                                        placeholder="John Smith"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                                    />
                                </div>
                            </div>

                            {/* Phone + Email row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            value={form.customer_phone}
                                            onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={form.customer_email}
                                            onChange={e => setForm({ ...form, customer_email: e.target.value })}
                                            placeholder="john@email.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Property Name */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Property Name *</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={form.property_name}
                                        onChange={e => setForm({ ...form, property_name: e.target.value })}
                                        placeholder="Skyline Towers 5"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                                    />
                                </div>
                            </div>

                            {/* Date + Time row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Date *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="date"
                                            value={form.appointment_date}
                                            onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Time *</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="time"
                                            value={form.appointment_time}
                                            onChange={e => setForm({ ...form, appointment_time: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Additional details about the visit..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-5 border-t border-white/10">
                            <button
                                onClick={() => { setShowModal(false); setForm(emptyForm); }}
                                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createAppointment}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
