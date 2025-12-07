"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="container-custom relative z-10 text-center">
                <AnimatedSection delay={0.2}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Streamline your workflow</span>
                    </div>
                </AnimatedSection>

                <AnimatedSection delay={0.4}>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                        <span className="block text-white">Effortless Leave</span>
                        <span className="text-gradient">Management</span>
                    </h1>
                </AnimatedSection>

                <AnimatedSection delay={0.6}>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Simplify leave requests, approvals, and tracking for your entire organization.
                        Experience the future of workforce management.
                    </p>
                </AnimatedSection>

                <AnimatedSection delay={0.8}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <button className="px-8 py-4 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform duration-300 shadow-glow">
                                Login Portal
                            </button>
                        </Link>
                        <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm">
                            Learn More
                        </button>
                    </div>
                </AnimatedSection>

                {/* Abstract Stats/Features Display */}
                <AnimatedSection delay={1.0} className="mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {/* Stat Card 1 */}
                        <SpotlightCard className="p-6 bg-white/5 border-white/10 group">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Fast Approvals</h3>
                            <p className="text-gray-400">Streamlined multi-tier approval process</p>
                        </SpotlightCard>

                        {/* Stat Card 2 */}
                        <SpotlightCard className="p-6 bg-white/5 border-white/10 group" spotlightColor="rgba(59, 130, 246, 0.2)">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Real-time Alerts</h3>
                            <p className="text-gray-400">Instant notifications for all updates</p>
                        </SpotlightCard>

                        {/* Stat Card 3 */}
                        <SpotlightCard className="p-6 bg-white/5 border-white/10 group" spotlightColor="rgba(236, 72, 153, 0.2)">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Calendar View</h3>
                            <p className="text-gray-400">Visual team availability tracking</p>
                        </SpotlightCard>
                    </div>
                </AnimatedSection>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2"
            >
                <span className="text-xs uppercase tracking-widest">Scroll</span>
                <ArrowDown className="w-5 h-5 animate-bounce" />
            </motion.div>
        </section>
    );
}
