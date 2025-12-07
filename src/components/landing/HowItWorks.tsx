"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { ArrowRight, FileText, UserCheck, CheckSquare } from "lucide-react";

const steps = [
    {
        title: "Request Leave",
        description: "Staff submits leave request with dates and reason.",
        icon: <FileText className="w-8 h-8 text-white" />,
        color: "from-purple-500 to-blue-500",
        step: "01",
    },
    {
        title: "PC Review",
        description: "Program Coordinator reviews and recommends action.",
        icon: <UserCheck className="w-8 h-8 text-white" />,
        color: "from-blue-500 to-cyan-500",
        step: "02",
    },
    {
        title: "Admin Approval",
        description: "Admin grants final approval and notifies staff.",
        icon: <CheckSquare className="w-8 h-8 text-white" />,
        color: "from-pink-500 to-rose-500",
        step: "03",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 relative bg-black/20" id="how-it-works">
            <div className="container-custom">
                <AnimatedSection className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                            How It <span className="text-gradient">Works</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl text-lg">
                            A simple, transparent process designed to keep everyone informed and aligned.
                        </p>
                    </div>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-[28%] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0" />

                    {steps.map((item, index) => (
                        <AnimatedSection key={index} delay={index * 0.2}>
                            <SpotlightCard className="h-full bg-[#0f172a]/80 p-1">
                                <div className="relative h-full rounded-xl p-8 overflow-hidden group">
                                    {/* Gradient Blob Background */}
                                    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${item.color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-5xl font-bold text-white/5 font-mono">{item.step}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>

                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                                            <ArrowRight className="w-6 h-6 text-white/20" />
                                        </div>
                                    )}
                                </div>
                            </SpotlightCard>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
