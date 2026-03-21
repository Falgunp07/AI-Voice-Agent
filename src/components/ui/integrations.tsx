'use client';
import { motion } from "framer-motion";

const integrations = [
    { name: "Salesforce", color: "from-blue-400 to-blue-600" },
    { name: "HubSpot", color: "from-orange-400 to-orange-600" },
    { name: "Twilio", color: "from-red-400 to-red-600" },
    { name: "Zapier", color: "from-amber-400 to-amber-600" },
    { name: "Slack", color: "from-purple-400 to-purple-600" },
    { name: "WhatsApp", color: "from-green-400 to-green-600" },
    { name: "Google Sheets", color: "from-emerald-400 to-emerald-600" },
    { name: "Calendly", color: "from-blue-400 to-indigo-600" },
];

export const Integrations = () => {
    return (
        <section className="py-32 relative overflow-hidden border-y border-white/5">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-400 font-medium tracking-wider uppercase text-sm"
                    >
                        Integrations
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 mt-2"
                    >
                        Works With Your Stack.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        Connect PropCall to the tools you already use. No migration needed.
                    </motion.p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {integrations.map((integration, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 md:p-8 flex flex-col items-center gap-4 hover:border-indigo-500/50 transition-all duration-500 cursor-pointer"
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Icon Circle */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                {integration.name.charAt(0)}
                            </div>

                            <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors relative z-10">
                                {integration.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
