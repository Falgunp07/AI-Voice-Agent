'use client';
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTABanner = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950" />
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        14-day free trial. No credit card required.
                    </div>

                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
                        <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                            Ready to Put Your
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Sales on Autopilot?
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Join hundreds of real estate businesses already using PropCall to close
                        more deals with less effort. Setup takes less than 5 minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-1 flex items-center gap-2 text-lg"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#"
                            className="px-8 py-4 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-lg"
                        >
                            Book a Demo
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
