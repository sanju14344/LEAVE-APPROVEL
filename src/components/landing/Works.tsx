"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const projects = [
    {
        title: "E-Commerce Platform",
        category: "Web Development",
        image: "https://images.unsplash.com/photo-1661956602116-aa6865609028?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        color: "from-purple-500 to-blue-500",
    },
    {
        title: "Finance Dashboard",
        category: "UI/UX Design",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        color: "from-blue-500 to-cyan-500",
    },
    {
        title: "Social Media App",
        category: "Mobile App",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        color: "from-pink-500 to-rose-500",
    },
];

export default function Works() {
    return (
        <section className="py-24 relative bg-black/20" id="works">
            <div className="container-custom">
                <AnimatedSection className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">
                            Selected <span className="text-gradient">Works</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl">
                            A collection of projects that challenge the status quo and push boundaries.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors group">
                        View All Projects
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </AnimatedSection>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((project, index) => (
                        <AnimatedSection key={index} delay={index * 0.2}>
                            <div className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3]">
                                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-10`} />
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                                <div className="absolute bottom-0 left-0 p-6 w-full z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="text-sm text-purple-300 font-medium mb-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        {project.category}
                                    </span>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-white">{project.title}</h3>
                                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
