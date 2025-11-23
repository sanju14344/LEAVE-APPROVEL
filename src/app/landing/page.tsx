"use client";

import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Works from "@/components/landing/Works";
import Contact from "@/components/landing/Contact";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white overflow-x-hidden selection:bg-purple-500/30">
      <Hero />
      <About />
      <Works />
      <Contact />

      <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5">
        <p>© {new Date().getFullYear()} Creative Studio. All rights reserved.</p>
      </footer>
    </main>
  );
}
