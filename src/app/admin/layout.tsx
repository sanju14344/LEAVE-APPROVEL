"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Stream = "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL";

const getStreamColor = (stream: Stream) => {
    const colors = {
        CSE: "from-blue-600 to-blue-800",
        ECE: "from-purple-600 to-purple-800",
        EEE: "from-amber-500 to-amber-700",
        MECH: "from-red-600 to-red-800",
        CIVIL: "from-green-600 to-green-800",
    };
    return colors[stream];
};

const navigation = [
    { name: "Overview", href: "/admin", icon: "📊" },
    { name: "Leave Requests", href: "/admin/requests", icon: "📝" },
    { name: "Users", href: "/admin/users", icon: "👥" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [userStream, setUserStream] = useState<Stream | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) {
                router.replace("/login");
                return;
            }

            const metaRole = (user.user_metadata as any)?.role;
            if (metaRole !== "admin") {
                if (metaRole === "pc") router.replace("/pc");
                else if (metaRole === "staff") router.replace("/staff");
                else router.replace("/login");
                return;
            }

            setUserStream((user.user_metadata as any)?.stream || "CSE");
            setUserName((user.user_metadata as any)?.full_name || user.email || "Admin");
        };

        checkAuth();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/landing");
    };

    if (!userStream) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-900">
                <p className="text-neutral-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-neutral-900">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-strong border-r border-neutral-800">
                <div className="flex flex-col flex-1">
                    {/* Logo/Header */}
                    <div className="p-6 border-b border-neutral-800">
                        <h1 className="text-xl font-bold text-neutral-100 mb-2">Admin Panel</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">Department:</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r ${getStreamColor(userStream)}`}>
                                {userStream}
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-purple-600 text-white shadow-lg"
                                            : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-neutral-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center text-white font-semibold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-100 truncate">{userName}</p>
                                <p className="text-xs text-neutral-400">Administrator</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="w-full rounded-lg glass px-4 py-2 text-sm font-medium text-neutral-300 hover:text-neutral-100 hover:bg-white/5 transition-all"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-neutral-800">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-lg font-bold text-neutral-100">Admin Panel</h1>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg glass hover:bg-white/5 transition-all"
                    >
                        <svg className="w-6 h-6 text-neutral-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="border-t border-neutral-800 p-4 space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-purple-600 text-white"
                                            : "text-neutral-300 hover:bg-white/5"
                                        }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-300 hover:bg-white/5 transition-all"
                        >
                            <span className="text-lg">🚪</span>
                            <span>Sign out</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-0 mt-16 lg:mt-0">
                {children}
            </main>
        </div>
    );
}
