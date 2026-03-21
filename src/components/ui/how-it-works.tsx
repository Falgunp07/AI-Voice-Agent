'use client';
import { motion } from "framer-motion";
import { Upload, Bot, Calendar, TrendingUp } from "lucide-react";

const steps = [
    {
        icon: Upload,
        title: "Upload Your Leads",
        description: "Import your lead list via Excel or connect your CRM. Our system maps fields automatically.",
        color: "indigo",
        gradient: "from-indigo-500 to-indigo-600",
        glow: "bg-indigo-500/20",
    },
    {
        icon: Bot,
        title: "AI Makes the Calls",
        description: "Our voice agent calls each lead with human-like conversation, handling objections and qualifying prospects.",
        color: "purple",
        gradient: "from-purple-500 to-purple-600",
        glow: "bg-purple-500/20",
    },
    {
        icon: Calendar,
        title: "Appointments Booked",
        description: "Qualified leads are automatically scheduled for site visits. Confirmations sent via WhatsApp.",
        color: "cyan",
        gradient: "from-cyan-500 to-cyan-600",
        glow: "bg-cyan-500/20",
    },
    {
        icon: TrendingUp,
        title: "Close More Deals",
        description: "Track your pipeline in real-time. See every call, every lead, every conversion at a glance.",
        color: "emerald",
        gradient: "from-emerald-500 to-emerald-600",
        glow: "bg-emerald-500/20",
    },
];

export const HowItWorks = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-950" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-400 font-medium tracking-wider uppercase text-sm"
                    >
                        How It Works
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 mt-2"
                    >
                        Four Steps to Autopilot.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        From lead upload to closed deal — fully automated in minutes.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-emerald-500/30" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            className="relative group"
                        >
                            {/* Step Number */}
                            <div className="flex justify-center mb-8">
                                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <step.icon className="w-7 h-7 text-white" />
                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-xs font-bold`}>
                                        {i + 1}
                                    </div>
                                    {/* Glow */}
                                    <div className={`absolute inset-0 ${step.glow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
