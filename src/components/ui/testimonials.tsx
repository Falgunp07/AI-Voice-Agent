'use client';
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
    {
        quote: "The interface is so clean, it makes other tools look cluttered. It just works.",
        author: "Sarah J.",
        role: "Re/Max Elite",
        rating: 5,
    },
    {
        quote: "Finally, an AI tool that respects my time. Setup took 5 minutes.",
        author: "David L.",
        role: "Century 21",
        rating: 5,
    },
    {
        quote: "Minimalist design, maximum impact. My lead response time is instant now.",
        author: "Jessica M.",
        role: "Keller Williams",
        rating: 5,
    },
    {
        quote: "I love the focus on essentials. No distractions, just deals.",
        author: "Michael R.",
        role: "Independent",
        rating: 4,
    },
    {
        quote: "PropCall is the 'Apple' of real estate AI. Beautiful and functional.",
        author: "Emily T.",
        role: "Sotheby's",
        rating: 5,
    },
];

export const Testimonials = () => {
    return (
        <section className="py-32 overflow-hidden border-b border-white/10 relative">
            <div className="max-w-7xl mx-auto px-6 mb-20 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-6">
                    Trusted by Design.
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 mx-auto rounded-full" />
            </div>

            <div className="relative flex overflow-x-hidden group">
                <motion.div
                    className="flex gap-8 whitespace-nowrap animate-marquee"
                    animate={{ x: [0, -1200] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30
                    }}
                >
                    {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                        <div
                            key={i}
                            className="w-[350px] md:w-[450px] p-8 border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl flex-shrink-0 whitespace-normal hover:border-indigo-500/50 transition-all duration-500 group/card relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                            {/* Quote Icon Watermark */}
                            <div className="absolute top-4 right-6 text-indigo-500/10 text-6xl font-serif leading-none select-none pointer-events-none group-hover/card:text-indigo-500/20 transition-colors">
                                &quot;
                            </div>

                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, si) => (
                                    <Star
                                        key={si}
                                        className={`w-4 h-4 ${si < t.rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-lg md:text-xl font-medium leading-relaxed mb-6 text-white/90 group-hover/card:text-white transition-colors">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-indigo-500 to-cyan-500">
                                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-sm font-bold text-white">
                                        {t.author.charAt(0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover/card:text-indigo-200 transition-colors">{t.author}</div>
                                    <div className="text-sm text-slate-400 group-hover/card:text-slate-300 transition-colors">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Gradient Masks */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            </div>
        </section>
    );
};
