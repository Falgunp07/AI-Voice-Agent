'use client';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setName(user.user_metadata?.name || '');
                setEmail(user.email || '');
            }
        };
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });
        setLoadingProfile(true);

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({
            data: { name: name }
        });

        if (error) {
            setProfileMessage({ type: 'error', text: error.message });
        } else {
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Update local user state
            if (user) {
                setUser({ ...user, user_metadata: { ...user.user_metadata, name } });
            }
            // Clear message after 3 seconds
            setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
        }
        setLoadingProfile(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setSecurityMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoadingSecurity(true);

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setSecurityMessage({ type: 'error', text: error.message });
        } else {
            setSecurityMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Clear message after 3 seconds
            setTimeout(() => setSecurityMessage({ type: '', text: '' }), 3000);
        }
        setLoadingSecurity(false);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Merchant Profile
                </h1>
                <p className="text-slate-400 mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information Card */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            Personal Information
                        </h2>
                    </div>

                    <div className="p-6 flex-1">
                        <form onSubmit={handleUpdateProfile} className="space-y-5 flex flex-col h-full">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/50 border border-white/5 text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Email address cannot be changed currently.</p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                {profileMessage.text && (
                                    <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${profileMessage.type === 'error'
                                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {profileMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                                        <p>{profileMessage.text}</p>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loadingProfile}
                                    className="w-full px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingProfile ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Security Card */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-400" />
                            Security
                        </h2>
                    </div>

                    <div className="p-6 flex-1">
                        <form onSubmit={handleUpdatePassword} className="space-y-5 flex flex-col h-full">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                {securityMessage.text && (
                                    <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-sm ${securityMessage.type === 'error'
                                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {securityMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                                        <p>{securityMessage.text}</p>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loadingSecurity}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors border border-white/5 hover:border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingSecurity ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
