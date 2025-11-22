"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import UserRoleBadge from "@/components/UserRoleBadge";

type Stream = "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL";
type UserRole = "staff" | "pc" | "admin";

type User = {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    stream: Stream;
    created_at: string;
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [userStream, setUserStream] = useState<Stream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) {
                router.replace("/login");
                return;
            }

            const metaStream = (user.user_metadata as any)?.stream as Stream;
            setUserStream(metaStream || "CSE");

            // Fetch users from profiles table
            const { data: profiles, error: queryError } = await supabase
                .from("profiles")
                .select("*")
                .eq("stream", metaStream || "CSE")
                .order("created_at", { ascending: false });

            if (queryError) {
                setError(queryError.message);
                setLoading(false);
                return;
            }

            setUsers(profiles ?? []);
            setFilteredUsers(profiles ?? []);
            setLoading(false);
        };

        load();
    }, [router]);

    useEffect(() => {
        let filtered = users;

        // Filter by role
        if (roleFilter !== "all") {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(u =>
                u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [users, roleFilter, searchQuery]);

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        setError(null);
        setSuccess(null);

        // Update in profiles table
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("id", userId);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        // Also update user_metadata in auth (for consistency)
        // Note: This requires service role key, so we'll just update profiles table
        // The user will need to re-login for metadata to sync, or we handle it in the trigger

        // Update local state
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

        const user = users.find(u => u.id === userId);
        setSuccess(`Successfully updated ${user?.full_name}'s role to ${newRole.toUpperCase()}`);

        setTimeout(() => setSuccess(null), 3000);
    };

    const appointAsPC = (userId: string) => {
        const confirmAppoint = window.confirm(
            "Are you sure you want to appoint this user as Program Coordinator?"
        );
        if (confirmAppoint) {
            updateUserRole(userId, "pc");
        }
    };

    const removePC = (userId: string) => {
        const confirmRemove = window.confirm(
            "Are you sure you want to remove this user's PC role?"
        );
        if (confirmRemove) {
            updateUserRole(userId, "staff");
        }
    };

    const stats = {
        all: users.length,
        staff: users.filter(u => u.role === "staff").length,
        pc: users.filter(u => u.role === "pc").length,
        admin: users.filter(u => u.role === "admin").length,
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Manage users and appoint Program Coordinators in your department</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-foreground">{stats.all}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Advisors</p>
                        <p className="text-2xl font-bold text-foreground">{stats.staff}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-blue-500 mb-1">Program Coordinators</p>
                        <p className="text-2xl font-bold text-blue-500">{stats.pc}</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                        onClick={() => setRoleFilter("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${roleFilter === "all"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                    >
                        All ({stats.all})
                    </button>
                    <button
                        onClick={() => setRoleFilter("staff")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${roleFilter === "staff"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                    >
                        Advisors ({stats.staff})
                    </button>
                    <button
                        onClick={() => setRoleFilter("pc")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${roleFilter === "pc"
                            ? "bg-blue-600 text-white"
                            : "bg-card border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                    >
                        PC ({stats.pc})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg bg-input border border-input px-4 py-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-sm text-emerald-500">{success}</p>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {searchQuery || roleFilter !== "all"
                                    ? "No users match your filters"
                                    : "No users found"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-card/50 border border-border/50 rounded-xl p-5 hover:bg-accent/50 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-start gap-4 flex-1 min-w-[250px]">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0 shadow-sm">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-foreground">{user.full_name}</p>
                                                    <UserRoleBadge role={user.role} />
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                                                <p className="text-xs text-muted-foreground/70">
                                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {user.role === "staff" && (
                                                <button
                                                    onClick={() => appointAsPC(user.id)}
                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 hover:scale-105 transition-all whitespace-nowrap shadow-sm"
                                                >
                                                    👔 Appoint as PC
                                                </button>
                                            )}

                                            {user.role === "pc" && (
                                                <button
                                                    onClick={() => removePC(user.id)}
                                                    className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all whitespace-nowrap"
                                                >
                                                    Remove PC Role
                                                </button>
                                            )}

                                            {user.role === "admin" && (
                                                <div className="px-4 py-2 text-xs text-muted-foreground">
                                                    Administrator
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
