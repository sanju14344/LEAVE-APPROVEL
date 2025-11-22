"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import StatusBadge from "@/components/StatusBadge";
import { UsersIcon, UserIcon, BriefcaseIcon, FileTextIcon } from "@/components/icons";

type Stream = "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL";
type LeaveStatus = "pending_pc" | "pending_admin" | "approved" | "declined";

type LeaveRequest = {
  id: string;
  student_name: string;
  status: LeaveStatus;
  created_at: string;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function AdminOverview() {
  const router = useRouter();
  const [userStream, setUserStream] = useState<Stream | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingPC: 0,
    pendingAdmin: 0,
    approved: 0,
    declined: 0,
    totalUsers: 0,
    totalStaff: 0,
    totalPC: 0,
  });
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

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
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');

      // Fetch leave requests statistics
      const { data: requests } = await supabase
        .from("leave_requests")
        .select("id, student_name, status, created_at")
        .eq("stream", metaStream || "CSE")
        .order("created_at", { ascending: false });

      if (requests) {
        setStats({
          totalRequests: requests.length,
          pendingPC: requests.filter(r => r.status === "pending_pc").length,
          pendingAdmin: requests.filter(r => r.status === "pending_admin").length,
          approved: requests.filter(r => r.status === "approved").length,
          declined: requests.filter(r => r.status === "declined").length,
          totalUsers: 0, // Will be updated from profiles
          totalStaff: 0,
          totalPC: 0,
        });
        setRecentRequests(requests.slice(0, 5));
      }

      // Fetch user statistics
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("stream", metaStream || "CSE");

      if (profiles) {
        setStats(prev => ({
          ...prev,
          totalUsers: profiles.length,
          totalStaff: profiles.filter(p => p.role === "staff").length,
          totalPC: profiles.filter(p => p.role === "pc").length,
        }));
      }

      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {getGreeting()}, <span className="font-semibold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">{userName}</span>! Here's what's happening in your department.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 transition-all duration-300 shadow-sm animate-stagger-in">
            <p className="text-xs text-muted-foreground mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalRequests}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-blue transition-all duration-300 shadow-sm border-l-4 border-l-blue-500 animate-stagger-in" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs text-blue-500 mb-1">Pending PC</p>
            <p className="text-3xl font-bold text-blue-500">{stats.pendingPC}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-amber transition-all duration-300 shadow-sm border-l-4 border-l-amber-500 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs text-amber-500 mb-1">Pending Admin</p>
            <p className="text-3xl font-bold text-amber-500">{stats.pendingAdmin}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-green transition-all duration-300 shadow-sm border-l-4 border-l-emerald-500 animate-stagger-in" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs text-emerald-500 mb-1">Approved</p>
            <p className="text-3xl font-bold text-emerald-500">{stats.approved}</p>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-stagger-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UsersIcon className="text-primary" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-stagger-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Advisors</p>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserIcon className="text-blue-500" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalStaff}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Recent Leave Requests</h2>
            <Link
              href="/admin/requests"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all →
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No recent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-card/50 border border-border/50 rounded-lg p-4 hover:bg-accent/50 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-medium text-foreground">{request.student_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/requests"
            className="bg-card border border-border rounded-xl p-6 hover:bg-accent/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <FileTextIcon className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Manage Requests</h3>
                <p className="text-sm text-muted-foreground">Review and approve leave requests</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-card border border-border rounded-xl p-6 hover:bg-accent/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <UsersIcon className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View users and appoint PCs</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
