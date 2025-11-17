"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LandingPage() {
  const router = useRouter();

  // If a user is already authenticated, immediately jump to the correct dashboard.
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
    <main className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 text-center overflow-hidden">
        {/* Purple angled strip behind heading */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-purple-600 rotate-[-8deg] origin-left -translate-x-10"
        />
        <h1 className="relative z-10 max-w-4xl text-4xl md:text-6xl font-extrabold leading-tight">
          Modern <span className="text-purple-500">Leave Management</span> for
          Schools
        </h1>
        <p className="relative z-10 mt-6 max-w-xl text-lg text-neutral-300">
          Replace paperwork with a lightning-fast digital workflow that keeps
          staff, students and administrators in sync.
        </p>
        <div className="relative z-10 mt-8 flex gap-4 flex-col sm:flex-row">
          <Link
            href="/login"
            className="rounded-md bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-purple-500 transition"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="rounded-md border border-neutral-600 px-6 py-3 text-sm font-semibold text-neutral-100 hover:bg-neutral-800 transition"
          >
            Learn more
          </a>
        </div>
        {/* Decorative blurred gradient */}
        <div
          aria-hidden
          className="absolute -bottom-20 right-0 h-64 w-64 bg-purple-600/30 blur-3xl rounded-full"
        />
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16"
      >
        <h2 className="text-center text-3xl font-bold mb-12">
          Why schools choose <span className="text-purple-500">LeaveWeb</span>
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Paperless & Fast",
              desc: "Submit and approve leave requests in seconds, not days.",
              emoji: "📄",
            },
            {
              title: "Real-time Tracking",
              desc: "See request status and history instantly on any device.",
              emoji: "🚀",
            },
            {
              title: "Secure Storage",
              desc: "All documents are stored safely in Supabase storage.",
              emoji: "🔒",
            },
            {
              title: "Role-based Access",
              desc: "Separate dashboards for staff and administrators.",
              emoji: "👥",
            },
            {
              title: "Analytics",
              desc: "Built-in insights help you understand absentee trends.",
              emoji: "📊",
            },
            {
              title: "Mobile-friendly",
              desc: "Optimised for phones, tablets and desktops.",
              emoji: "📱",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col rounded-lg bg-neutral-800 p-6 shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-4" aria-hidden>
                {f.emoji}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-neutral-100">
                {f.title}
              </h3>
              <p className="text-sm text-neutral-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} LeaveWeb. Built with Next.js & Supabase.
      </footer>
    </main>
  );
}
