"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// Professional department icons
const DepartmentIcon = ({ type }: { type: string }) => {
  const icons = {
    CSE: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    ECE: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    EEE: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    MECH: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
      </svg>
    ),
    CIVIL: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M6 18V9M10 18V9M14 18V9M18 18V9M3 9l9-7 9 7" />
      </svg>
    ),
  };
  return icons[type as keyof typeof icons] || null;
};

const STREAMS = [
  { name: "CSE", color: "from-blue-600 to-blue-800" },
  { name: "ECE", color: "from-purple-600 to-purple-800" },
  { name: "EEE", color: "from-amber-500 to-amber-700" },
  { name: "MECH", color: "from-red-600 to-red-800" },
  { name: "CIVIL", color: "from-green-600 to-green-800" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const role = (user.user_metadata as any)?.role;
      if (role === "admin") router.replace("/admin");
      else router.replace("/staff");
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-5xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">Next-Gen Leave Management</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Modern{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Leave Management
            </span>
            <br />
            for Engineering Colleges
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline your leave approval process with department-based access control,
            real-time tracking, and a beautiful interface that everyone will love.
          </p>

          <div className="flex gap-4 flex-col sm:flex-row justify-center">
            <Link
              href="/login"
              className="group rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
            >
              Get Started
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a
              href="#features"
              className="rounded-xl bg-card border border-border px-8 py-4 text-base font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-all"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Departments Section */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Department-Based Access Control
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each department has its own isolated workspace. Admins and staff only see requests from their department.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STREAMS.map((stream, index) => (
            <div
              key={stream.name}
              className="bg-card border border-border rounded-2xl p-6 text-center hover:scale-105 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-3 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                <DepartmentIcon type={stream.name} />
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${stream.color}`}>
                {stream.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16"
      >
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
          Why colleges choose{" "}
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            LeaveWeb
          </span>
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Paperless & Fast",
              desc: "Submit and approve leave requests in seconds, not days.",
              emoji: "📄",
              gradient: "from-blue-500/10 to-blue-600/10 text-blue-500",
            },
            {
              title: "Real-time Tracking",
              desc: "See request status and history instantly on any device.",
              emoji: "🚀",
              gradient: "from-purple-500/10 to-purple-600/10 text-purple-500",
            },
            {
              title: "Secure Storage",
              desc: "All documents are stored safely in Supabase storage.",
              emoji: "🔒",
              gradient: "from-emerald-500/10 to-emerald-600/10 text-emerald-500",
            },
            {
              title: "Department Isolation",
              desc: "Each department has complete data privacy and isolation.",
              emoji: "🏢",
              gradient: "from-amber-500/10 to-amber-600/10 text-amber-500",
            },
            {
              title: "Modern Interface",
              desc: "Beautiful glassmorphism design with smooth animations.",
              emoji: "✨",
              gradient: "from-pink-500/10 to-pink-600/10 text-pink-500",
            },
            {
              title: "Mobile-friendly",
              desc: "Optimised for phones, tablets and desktops.",
              emoji: "📱",
              gradient: "from-cyan-500/10 to-cyan-600/10 text-cyan-500",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-card border border-border rounded-2xl p-6 hover:scale-105 transition-all group animate-fade-in shadow-sm hover:shadow-md`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                {feature.emoji}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 py-20 text-center">
        <div className="bg-card border border-border rounded-3xl p-12 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to modernize your leave management?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join colleges that have already switched to a faster, more efficient way of managing student leaves.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} LeaveWeb. Built with Next.js & Supabase.</p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Featuring department-based access control for CSE, ECE, EEE, MECH & CIVIL
        </p>
      </footer>
    </main>
  );
}
