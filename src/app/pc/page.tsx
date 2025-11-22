"use client";

import { useEffect, useState, FormEvent } from "react";
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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

export default function PCPage() {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
    const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
    const [userStream, setUserStream] = useState<Stream | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [userId, setUserId] = useState<string>("");

    // Form State
    const [studentName, setStudentName] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [regNo, setRegNo] = useState("");
    const [cgpa, setCgpa] = useState("");
    const [attendance, setAttendance] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reason, setReason] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchRequests = async (stream: Stream, uid: string) => {
        // Fetch Pending Requests (for approval)
        const { data: pendingRows, error: pendingError } = await supabase
            .from("leave_requests")
            .select(`
        *,
        profiles:requested_by (
          full_name
        )
      `)
            .eq("stream", stream)
            .eq("status", "pending_pc")
            .order("created_at", { ascending: true });

        if (pendingError) console.error("Error fetching pending requests:", pendingError);
        else setPendingRequests((pendingRows as any) ?? []);

        // Fetch My Requests (submitted by PC)
        const { data: myRows, error: myError } = await supabase
            .from("leave_requests")
            .select(`
        *,
        profiles:requested_by (
          full_name
        )
      `)
            .eq("requested_by", uid)
            .order("created_at", { ascending: false });

        if (myError) console.error("Error fetching my requests:", myError);
        else setMyRequests((myRows as any) ?? []);
    };

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role, stream, full_name")
                .eq("id", user.id)
                .single();

            if (profile?.role !== "pc") {
                if (profile?.role === "admin") router.replace("/admin");
                else if (profile?.role === "staff") router.replace("/staff");
                else router.replace("/login");
                return;
            }

            const stream = profile.stream as Stream;
            setUserStream(stream);
            setUserId(user.id);
            setUserName(profile.full_name || user.email?.split('@')[0] || 'User');

            await fetchRequests(stream, user.id);
            setLoading(false);
        };

        load();
    }, [router]);

    const handleApprove = async (id: string) => {
        if (!window.confirm("Approve this request and send to Admin?")) return;

        const { error: updateError } = await supabase
            .from("leave_requests")
            .update({
                status: "pending_admin",
                pc_reviewed_by: userId,
                pc_reviewed_at: new Date().toISOString()
            })
            .eq("id", id);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        await fetchRequests(userStream!, userId);
        setSuccess("Request approved and sent to Admin");
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleDecline = async (id: string) => {
        if (!window.confirm("Decline this request?")) return;

        const { error: updateError } = await supabase
            .from("leave_requests")
            .update({
                status: "declined",
                pc_reviewed_by: userId,
                pc_reviewed_at: new Date().toISOString(),
                declined_by: userId
            })
            .eq("id", id);

        if (updateError) {
            setError(updateError.message);
            return;
        }
        await fetchRequests(userStream!, userId);
        setSuccess("Request declined");
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        if (!userStream || !userId) return;

        let attachment_url: string | null = null;
        if (file) {
            const filePath = `${userId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("leave_attachments")
                .upload(filePath, file);
            if (uploadError) {
                setError(uploadError.message);
                setSubmitting(false);
                return;
            }
            const { data: publicUrl } = supabase.storage.from("leave_attachments").getPublicUrl(filePath);
            attachment_url = publicUrl.publicUrl;
        }

        const { error: insertError } = await supabase.from("leave_requests").insert({
            student_name: studentName,
            student_class: studentClass,
            reg_no: regNo,
            cgpa: parseFloat(cgpa) || null,
            attendance_percentage: parseFloat(attendance) || null,
            from_date: fromDate,
            to_date: toDate,
            reason,
            attachment_url,
            status: "pending_admin", // PC requests go straight to Admin
            requested_by: userId,
            stream: userStream,
            pc_reviewed_by: userId, // Auto-reviewed by themselves
            pc_reviewed_at: new Date().toISOString()
        });

        if (insertError) {
            setError(insertError.message);
            setSubmitting(false);
            return;
        }

        await fetchRequests(userStream!, userId);

        setStudentName("");
        setStudentClass("");
        setRegNo("");
        setCgpa("");
        setAttendance("");
        setFromDate("");
        setToDate("");
        setReason("");
        setFile(null);
        setFileName("");
        setSuccess("Leave request submitted successfully!");
        setSubmitting(false);
        setTimeout(() => setSuccess(null), 3000);
    };

    const deleteRequest = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this request?")) return;

        const { error: deleteError } = await supabase
            .from("leave_requests")
            .delete()
            .eq("id", id);

        if (deleteError) {
            setError(deleteError.message);
            return;
        }
        await fetchRequests(userStream!, userId);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace("/landing");
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
                        <h1 className="text-3xl font-bold text-foreground mb-1">PC Dashboard</h1>
                        <p className="text-muted-foreground mb-2">
                            {getGreeting()}, <span className="font-semibold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">{userName}</span>! Manage approvals and requests
                        </p>
                        {userStream && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Department:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStreamColor(userStream)}`}>
                                    {userStream}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
                    >
                        Sign out
                    </button>
                </header>

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

                {/* Pending Approvals Section */}
                <section className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                    <h2 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
                        Pending Approvals
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{pendingRequests.length}</span>
                    </h2>

                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No pending requests to review.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map((request) => (
                                <div key={request.id} className="bg-card/50 border border-border/50 rounded-xl p-5 hover:bg-accent/50 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-foreground">{request.student_name}</h3>
                                            <p className="text-sm text-muted-foreground">{request.student_class}</p>
                                            {request.reg_no && <p className="text-xs text-muted-foreground mt-1">Reg: {request.reg_no}</p>}
                                        </div>
                                        <StatusBadge status={request.status} />
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>CGPA: {request.cgpa ?? 'N/A'}</span>
                                            <span>Att: {request.attendance_percentage ? `${request.attendance_percentage}%` : 'N/A'}</span>
                                        </div>
                                        <div className="p-2 rounded bg-muted/50 text-sm text-foreground">
                                            <p className="text-xs text-muted-foreground mb-1">Reason</p>
                                            {request.reason || "No reason provided"}
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>From: {request.from_date}</span>
                                            <span>To: {request.to_date}</span>
                                        </div>
                                        <div className="pt-2 border-t border-border/50">
                                            <p className="text-xs text-muted-foreground">Requested by: <span className="text-foreground">{request.profiles?.full_name}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="flex-1 rounded-lg bg-emerald-500/10 text-emerald-500 py-2 text-sm font-medium hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleDecline(request.id)}
                                            className="flex-1 rounded-lg bg-destructive/10 text-destructive py-2 text-sm font-medium hover:bg-destructive/20 transition-all border border-destructive/20"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    {/* Request Form */}
                    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-lg h-fit">
                        <h2 className="mb-6 text-xl font-bold text-foreground">Submit New Request</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Student Name</label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="Enter student name"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Class</label>
                                <input
                                    type="text"
                                    value={studentClass}
                                    onChange={(e) => setStudentClass(e.target.value)}
                                    required
                                    className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                    placeholder="e.g., 3rd Year A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Reg. No</label>
                                    <input
                                        type="text"
                                        value={regNo}
                                        onChange={(e) => setRegNo(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                        placeholder="e.g., 9100..."
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-muted-foreground">CGPA</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        value={cgpa}
                                        onChange={(e) => setCgpa(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                        placeholder="e.g., 8.5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Attendance %</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={attendance}
                                        onChange={(e) => setAttendance(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                        placeholder="e.g., 85.5"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-muted-foreground">From Date</label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-muted-foreground">To Date</label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        required
                                        className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Reason</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                                    placeholder="Enter reason..."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-muted-foreground">Attachment</label>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setFile(f);
                                        setFileName(f ? f.name : "");
                                    }}
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-lg hover:shadow-glow hover:scale-[1.02] disabled:opacity-50 transition-all"
                            >
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>

                    {/* My Requests List */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                        <h2 className="mb-6 text-xl font-bold text-foreground">My Submitted Requests</h2>
                        {myRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">You haven't submitted any requests.</p>
                            </div>
                        ) : (
                            <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {myRequests.map((request) => (
                                    <li key={request.id} className="bg-card/50 border border-border/50 rounded-xl p-4 hover:bg-accent/50 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-foreground">{request.student_name}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>{request.student_class}</span>
                                                    {request.reg_no && <span>• {request.reg_no}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={request.status} />
                                                <button
                                                    onClick={() => deleteRequest(request.id)}
                                                    className="text-xs text-destructive hover:text-destructive/80"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Submitted {new Date(request.created_at).toLocaleDateString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
