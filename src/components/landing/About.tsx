"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { Code2, Palette, Rocket, Zap } from "lucide-react";

const features = [
    {
        icon: <Palette className="w-6 h-6 text-purple-400" />,
        title: "UI/UX Design",
        description: "Creating intuitive and visually stunning interfaces that users love.",
    },
    {
        icon: <Code2 className="w-6 h-6 text-blue-400" />,
        title: "Full Stack Dev",
        description: "Building robust applications with modern technologies like Next.js and Supabase.",
    },
    {
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        title: "Performance",
        description: "Optimizing for speed and efficiency to ensure smooth user experiences.",
    },
    {
        icon: <Rocket className="w-6 h-6 text-pink-400" />,
        title: "Scalability",
        description: "Designing systems that grow with your business needs.",
    },
];

export default function About() {
    return (
        <section className="py-24 relative" id="about">
            <div className="container-custom">
                <AnimatedSection className="mb-16 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Passion for <span className="text-gradient-blue">Excellence</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        I combine technical expertise with creative vision to deliver exceptional digital solutions.
                    </p>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <AnimatedSection key={index} delay={index * 0.1} direction="up">
                            <div className="glass p-8 rounded-2xl h-full hover:bg-white/5 transition-colors duration-300 card-hover-glow group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
