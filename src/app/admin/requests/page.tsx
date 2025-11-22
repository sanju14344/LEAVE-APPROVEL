"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import StatusBadge from "@/components/StatusBadge";

type Stream = "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL";
type LeaveStatus = "pending_pc" | "pending_admin" | "approved" | "declined";

type LeaveRequest = {
    id: string;
    student_name: string;
    student_class: string;
    reg_no?: string;
    cgpa?: number;
    attendance_percentage?: number;
    from_date: string;
    to_date: string;
    reason: string | null;
    attachment_url?: string | null;
    status: LeaveStatus;
    created_at: string;
    stream: Stream;
    requested_by: string;
    profiles: {
        full_name: string;
    };
};

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

export default function AdminRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStream, setFilterStream] = useState<Stream | "ALL">("ALL");
    const [filterStatus, setFilterStatus] = useState<LeaveStatus | "ALL">("ALL");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchRequests = async () => {
        let query = supabase
            .from("leave_requests")
            .select(`
        *,
        profiles:requested_by (
          full_name
        )
      `)
            .order("created_at", { ascending: false });

        if (filterStream !== "ALL") {
            query = query.eq("stream", filterStream);
        }

        if (filterStatus !== "ALL") {
            query = query.eq("status", filterStatus);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching requests:", error);
        } else {
            setRequests((data as any) ?? []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "admin") {
                router.replace("/login");
                return;
            }

            fetchRequests();
        };

        checkAdmin();
    }, [router, filterStream, filterStatus]);

    const updateStatus = async (id: string, newStatus: "approved" | "declined") => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this request?`)) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: updateError } = await supabase
            .from("leave_requests")
            .update({
                status: newStatus,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                ...(newStatus === "declined" && { declined_by: user.id })
            })
            .eq("id", id);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setSuccess(`Request ${newStatus} successfully`);
        setTimeout(() => setSuccess(null), 3000);
        fetchRequests();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background px-4 py-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 animate-fade-in">
                {/* Header */}
                <header className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Leave Requests</h1>
                        <p className="text-muted-foreground">Manage and review student leave requests</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin")}
                        className="rounded-lg bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-all shadow-sm"
                    >
                        Back to Dashboard
                    </button>
                </header>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
                    <select
                        value={filterStream}
                        onChange={(e) => setFilterStream(e.target.value as Stream | "ALL")}
                        className="rounded-lg bg-input border border-input px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="ALL">All Departments</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as LeaveStatus | "ALL")}
                        className="rounded-lg bg-input border border-input px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="pending_pc">Pending PC</option>
                        <option value="pending_admin">Pending Admin</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                    </select>
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

                {/* Requests Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">No requests found matching your filters.</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{request.student_name}</h3>
                                        <p className="text-sm text-muted-foreground">{request.student_class}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${getStreamColor(request.stream)} text-white`}>
                                                {request.stream}
                                            </span>
                                            {request.reg_no && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                                                    {request.reg_no}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={request.status} />
                                </div>

                                <div className="space-y-3 mb-6 flex-grow">
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                        <div>
                                            <span className="block text-muted-foreground/70">CGPA</span>
                                            <span className="text-foreground font-medium">{request.cgpa ?? 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground/70">Attendance</span>
                                            <span className="text-foreground font-medium">{request.attendance_percentage ? `${request.attendance_percentage}%` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="text-muted-foreground/70">Duration:</span>
                                        <span>{request.from_date}</span>
                                        <span className="text-muted-foreground/70">to</span>
                                        <span>{request.to_date}</span>
                                    </div>

                                    {request.reason && (
                                        <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground italic border border-border/50">
                                            "{request.reason}"
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground">Requested by: <span className="text-foreground">{request.profiles?.full_name}</span></p>
                                    </div>

                                    {request.attachment_url && (
                                        <a
                                            href={request.attachment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline"
                                        >
                                            <span>📎</span> View Attachment
                                        </a>
                                    )}
                                </div>

                                {/* Actions - Only show for pending_admin requests */}
                                {request.status === "pending_admin" && (
                                    <div className="flex gap-2 pt-4 border-t border-border/50 mt-auto">
                                        <button
                                            onClick={() => updateStatus(request.id, "approved")}
                                            className="flex-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-2 text-sm font-medium hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => updateStatus(request.id, "declined")}
                                            className="flex-1 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 py-2 text-sm font-medium hover:bg-destructive hover:text-white transition-all"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                )}

                                {/* Show message if pending PC approval */}
                                {request.status === "pending_pc" && (
                                    <div className="mt-auto pt-4 border-t border-border/50 text-center">
                                        <p className="text-xs text-amber-500 italic">Waiting for PC approval</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
