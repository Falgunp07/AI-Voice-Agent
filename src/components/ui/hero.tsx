'use client';
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

import { useState, useEffect } from "react";

const texts = ["Never Sleeps.", "Is Innovative.", "Closes Deals."];

export const Hero = () => {
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % texts.length);
        }, 4000); // Change text every 4 seconds to match animation cycle
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

                {/* Moving Mesh Gradients */}
                <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-8 mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Introducing PropCall v2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] inline-block text-left">
                        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            The AI Agent
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            That{" "}
                        </span>
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent inline-block w-[15ch] align-top whitespace-nowrap">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={textIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-block"
                                >
                                    {texts[textIndex].split("").map((char, i) => (
                                        <motion.span
                                            key={`${textIndex}-${i}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: i * 0.05,
                                                ease: "easeOut"
                                            }}
                                        >
                                            {char === " " ? "\u00A0" : char}
                                        </motion.span>
                                    ))}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                    </h1>

                    <p className="max-w-[800px] text-lg md:text-xl text-slate-400 leading-relaxed">
                        Automate 100% of your real estate inquiries.
                        Qualify leads, book viewings, and close deals while you focus on what matters.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link
                            href="/signup"
                            className="h-12 px-8 rounded-full bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-500 transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
                        >
                            Start Free Trial
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button className="h-12 px-8 rounded-full border border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-300 font-medium flex items-center gap-2 transition-all backdrop-blur-sm">
                            <Play className="w-4 h-4 fill-current" />
                            Watch Demo
                        </button>
                    </div>
                </div>

                {/* 3D Dashboard Mockup */}
                <div className="relative w-full max-w-5xl mx-auto perspective-[2000px]">
                    <div className="relative rounded-xl border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-2xl transform rotate-x-[20deg] scale-95 opacity-90 transition-all duration-1000 hover:rotate-x-0 hover:scale-100 hover:opacity-100 group">
                        {/* Glow Behind */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        {/* Dashboard Header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5 rounded-t-xl">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            <div className="ml-4 h-6 w-64 bg-white/5 rounded-md border border-white/5"></div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-[400px] overflow-hidden bg-slate-950/80">
                            {/* Sidebar */}
                            <div className="hidden md:block col-span-1 space-y-4">
                                <div className="h-8 w-32 bg-indigo-500/20 rounded-lg animate-pulse"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-8 w-full bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center px-3 gap-3">
                                            <div className="w-4 h-4 rounded-full bg-white/10"></div>
                                            <div className="h-2 w-16 bg-white/10 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Chart Area */}
                            <div className="col-span-1 md:col-span-2 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <div className="text-sm text-slate-400 mb-1">Total Calls</div>
                                        <div className="text-2xl font-bold text-white">1,284</div>
                                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="w-3 h-3" /> +12.5%
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                        <div className="text-sm text-slate-400 mb-1">Qualified Leads</div>
                                        <div className="text-2xl font-bold text-white">432</div>
                                        <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="w-3 h-3" /> +8.2%
                                        </div>
                                    </div>
                                </div>

                                {/* Fake Chart */}
                                <div className="h-48 w-full rounded-xl border border-white/10 bg-white/5 flex items-end justify-between p-4 px-6 gap-2">
                                    {[30, 45, 35, 60, 50, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
                                        <div
                                            key={i}
                                            className="w-full bg-gradient-to-t from-indigo-500/20 to-indigo-500 rounded-t-sm transition-all hover:bg-indigo-400"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating Notifications */}
                        <div className="absolute -right-12 top-20 p-4 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-xl w-64 animate-bounce duration-[3000ms]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-black">JD</div>
                                <div>
                                    <div className="text-sm font-medium text-white">New Lead Qualified</div>
                                    <div className="text-xs text-emerald-400">Buying • $1.2M Budget</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-8 bottom-32 p-4 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-xl w-64 animate-[bounce_4s_infinite]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">AI</div>
                                <div>
                                    <div className="text-sm font-medium text-white">Call Completed</div>
                                    <div className="text-xs text-slate-400">Scheduled Viewing: 2pm</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
