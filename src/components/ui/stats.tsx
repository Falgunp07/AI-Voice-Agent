'use client';
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
    { value: 10000000, label: "Calls Made", suffix: "+", prefix: "" },
    { value: 99.9, label: "Uptime", suffix: "%", prefix: "" },
    { value: 50, label: "Languages", suffix: "+", prefix: "" },
    { value: 3, label: "Avg Response Time", suffix: "s", prefix: "<" },
];

const AnimatedCounter = ({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        if (num % 1 !== 0) return num.toFixed(1);
        return Math.floor(num).toString();
    };

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}{formatNumber(count)}{suffix}
        </span>
    );
};

export const Stats = () => {
    return (
        <section className="py-24 relative overflow-hidden border-b border-white/5">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="text-center group"
                        >
                            <div className="text-4xl md:text-6xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-3">
                                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                            </div>
                            <div className="text-sm md:text-base text-slate-400 font-medium uppercase tracking-wider">
                                {stat.label}
                            </div>
                            <div className="mt-4 w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
