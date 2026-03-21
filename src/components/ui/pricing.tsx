'use client';
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Starter",
        price: "$99",
        period: "/month",
        description: "Perfect for solo agents getting started with AI calling.",
        features: [
            "500 AI calls/month",
            "1 active campaign",
            "Basic analytics",
            "WhatsApp integration",
            "Email support",
        ],
        cta: "Start Free Trial",
        highlighted: false,
        borderColor: "border-white/10",
        hoverBorder: "hover:border-slate-500/50",
    },
    {
        name: "Professional",
        price: "$299",
        period: "/month",
        description: "For growing teams that need power and flexibility.",
        features: [
            "5,000 AI calls/month",
            "Unlimited campaigns",
            "Advanced analytics & reports",
            "Multi-language support",
            "CRM integrations",
            "Priority support",
            "Custom voice training",
        ],
        cta: "Start Free Trial",
        highlighted: true,
        borderColor: "border-indigo-500/50",
        hoverBorder: "hover:border-indigo-400",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For organizations with high-volume requirements.",
        features: [
            "Unlimited AI calls",
            "Custom AI model training",
            "Dedicated account manager",
            "SLA guarantee",
            "On-premise deployment",
            "API access",
            "White-label option",
        ],
        cta: "Contact Sales",
        highlighted: false,
        borderColor: "border-white/10",
        hoverBorder: "hover:border-slate-500/50",
    },
];

export const Pricing = () => {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-950" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/15 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-400 font-medium tracking-wider uppercase text-sm"
                    >
                        Pricing
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 mt-2"
                    >
                        Simple, Transparent Pricing.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        Start free. Scale as you grow. No hidden fees.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`relative overflow-hidden rounded-3xl border ${plan.borderColor} ${plan.hoverBorder} bg-slate-900/50 backdrop-blur-xl p-8 flex flex-col transition-all duration-500 group ${plan.highlighted ? 'md:-mt-4 md:mb-4 shadow-xl shadow-indigo-500/10' : ''}`}
                        >
                            {/* Hover Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${plan.highlighted ? 'from-indigo-500/10' : 'from-white/5'} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            {/* Popular Badge */}
                            {plan.highlighted && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                                    <Sparkles className="w-3 h-3" />
                                    Most Popular
                                </div>
                            )}

                            <div className="relative z-10 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                        {plan.price}
                                    </span>
                                    <span className="text-slate-400 text-lg">{plan.period}</span>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, fi) => (
                                        <li key={fi} className="flex items-center gap-3 text-sm text-slate-300">
                                            <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-indigo-400' : 'text-slate-500'}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/signup"
                                    className={`w-full py-3 rounded-xl text-center font-semibold text-sm transition-all duration-300 ${plan.highlighted
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5'
                                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
