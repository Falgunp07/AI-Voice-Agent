'use client';
import { Phone, MessageSquare, BarChart3, Globe } from "lucide-react";
export const Features = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-slate-950">
            {/* Background glow for section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="mb-20 text-center md:text-left relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10" />
                    <span className="text-indigo-400 font-medium tracking-wider uppercase text-sm">Capabilities</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 mt-2">
                        Intelligence at Scale.
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        A complete suite of AI tools designed to replace busywork with booked appointments.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">
                    {/* Large Card 1 */}
                    <div className="col-span-1 md:col-span-2 row-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 hover:border-indigo-500/50 transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-600/30 transition-colors" />

                        <div className="h-full flex flex-col justify-between relative z-10">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
                                    <Phone className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-3xl font-bold mb-4">AI Voice Agents</h3>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    Natural, human-like conversations that sound indistinguishable from a real agent. Handles objections, qualifications, and scheduling seamlessly.
                                </p>
                            </div>

                            <div className="mt-8 relative">
                                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/5 backdrop-blur-md">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-mono text-slate-400">Live Call Transcript</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-indigo-400">AI:</span> &quot;I can definitely book that viewing for you. Does Tuesday at 2 PM works?&quot;</p>
                                        <p><span className="text-slate-400">Lead:</span> &quot;Yes, that sounds perfect.&quot;</p>
                                        <p><span className="text-indigo-400">AI:</span> &quot;Great! I&apos;ve sent the confirmation to your WhatsApp.&quot;</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Small Card 1 */}
                    <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 hover:border-emerald-500/50 transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Instant WhatsApp</h3>
                        <p className="text-slate-400 text-sm">Auto-send brochures & locations instantly.</p>
                    </div>

                    {/* Small Card 2 */}
                    <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 hover:border-cyan-500/50 transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Globe className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Multi-Lingual</h3>
                        <p className="text-slate-400 text-sm">Fluent in 50+ languages and dialects.</p>
                    </div>

                    {/* Wide Low Card */}
                    <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 hover:border-violet-500/50 transition-all duration-500 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex-1 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <BarChart3 className="w-6 h-6 text-violet-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Deep Analytics</h3>
                            <p className="text-slate-400">Track every metric. From call duration to conversion rates, get real-time insights into your pipeline.</p>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="h-32 w-full bg-slate-900/50 rounded-xl border border-white/5 flex items-end justify-between p-4 px-6 gap-2">
                                {[30, 50, 45, 70, 60, 80, 55, 90, 85, 95].map((h, i) => (
                                    <div key={i} className="w-full bg-violet-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
