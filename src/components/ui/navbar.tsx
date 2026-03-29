'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        // Get initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-lg transition-all duration-300">
            {/* Glass Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity font-[family-name:var(--font-space)]">
                    PropCall<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.ai</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {["Product", "Solutions", "Pricing", "Enterprise"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-white/60 hover:text-white transition-colors relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-300"></span>
                        </Link>
                    ))}
                </div>

                {/* CTA / Auth Buttons */}
                <div className="flex items-center gap-4">
                    {!loading && (
                        user ? (
                            <>
                                <Link href="/dashboard" className="hidden md:block text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard"
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    Dashboard
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                            >
                                Login
                            </Link>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
};
