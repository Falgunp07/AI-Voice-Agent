'use client';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "How does the AI voice agent sound?",
        answer: "Our AI uses state-of-the-art voice synthesis that sounds completely natural. Leads cannot distinguish our AI from a human agent. The voice adapts tone and pacing based on the conversation context.",
    },
    {
        question: "How long does setup take?",
        answer: "You can be up and running in under 5 minutes. Simply upload your lead list, configure your campaign preferences, and let the AI handle the rest. No technical knowledge required.",
    },
    {
        question: "Can I customize what the AI says?",
        answer: "Absolutely. You can create custom scripts, set qualification criteria, define objection handling responses, and train the AI on your specific property details and talking points.",
    },
    {
        question: "What happens when a lead is interested?",
        answer: "The AI immediately qualifies the lead, books a site visit on your calendar, and sends a WhatsApp confirmation with property details, location, and scheduled time — all automatically.",
    },
    {
        question: "Is my data secure?",
        answer: "Yes. We use enterprise-grade encryption (AES-256) for all data at rest and in transit. We are SOC 2 Type II certified and GDPR compliant. Your lead data is never shared or used for training.",
    },
    {
        question: "Can I cancel anytime?",
        answer: "Yes, all plans are month-to-month with no long-term contracts. You can cancel, upgrade, or downgrade at any time from your dashboard. No cancellation fees.",
    },
];

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-950" />

            <div className="max-w-3xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-400 font-medium tracking-wider uppercase text-sm"
                    >
                        FAQ
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 mt-2"
                    >
                        Questions? Answered.
                    </motion.h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${openIndex === i
                                    ? 'border-indigo-500/30 bg-indigo-500/5'
                                    : 'border-white/10 bg-slate-900/30 hover:border-white/20'
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left gap-4"
                            >
                                <span className="font-semibold text-base md:text-lg">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-indigo-400' : ''
                                        }`}
                                />
                            </button>

                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="px-6 pb-6 text-slate-400 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
