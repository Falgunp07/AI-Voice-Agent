'use client';
import Link from "next/link";

export const Footer = () => {
    return (
        <footer className="py-20 border-t border-white/10 bg-black relative overflow-hidden">
            {/* Footer Glow */}
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                <div className="col-span-1 md:col-span-1">
                    <Link href="/" className="text-2xl font-bold tracking-tighter block mb-6">
                        PropCall<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">.ai</span>
                    </Link>
                    <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                        Simplicity is the ultimate sophistication.
                        Automating real estate with precision and elegance.
                    </p>
                </div>

                <div className="col-span-1">
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-white/40">Product</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Features</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Integrations</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Pricing</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Changelog</Link></li>
                    </ul>
                </div>

                <div className="col-span-1">
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-white/40">Company</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">About</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Careers</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Blog</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div className="col-span-1">
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-wider text-white/40">Legal</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Privacy</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Terms</Link></li>
                        <li><Link href="#" className="text-white/60 hover:text-indigo-400 transition-colors">Security</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/30 relative z-10">
                <p>&copy; 2026 PropCall AI Inc. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Designed in Switzerland
                    </span>
                </div>
            </div>
        </footer>
    );
};
