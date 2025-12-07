"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { Calendar, CheckCircle, Shield, Bell } from "lucide-react";

const features = [
    {
        icon: <Shield className="w-8 h-8 text-purple-400" />,
        title: "Role-Based Access",
        description: "Secure access controls for Staff, Program Coordinators, and Admins.",
    },
    {
        icon: <CheckCircle className="w-8 h-8 text-blue-400" />,
        title: "Multi-Level Approval",
        description: "Streamlined workflow from staff request to final admin approval.",
    },
    {
        icon: <Bell className="w-8 h-8 text-yellow-400" />,
        title: "Real-time Notifications",
        description: "Instant alerts for leave status updates and pending actions.",
    },
    {
        icon: <Calendar className="w-8 h-8 text-pink-400" />,
        title: "Calendar View",
        description: "Visual overview of team availability and leave schedules.",
    },
];

export default function Features() {
    return (
        <section className="py-24 relative" id="features">
            {/* Background Gradient Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="container-custom relative z-10">
                <AnimatedSection className="mb-16 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Powerful <span className="text-gradient-blue">Features</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Everything you need to manage workforce leave efficiently and transparently.
                    </p>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <AnimatedSection key={index} delay={index * 0.1} direction="up">
                            <SpotlightCard className="h-full p-8 bg-black/40 border-white/10 hover:border-white/20">
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                                    <p className="text-gray-400 leading-relaxed text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </SpotlightCard>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
