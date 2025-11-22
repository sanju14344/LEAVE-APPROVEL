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

export default function StaffPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
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

  const fetchRequests = async (stream: Stream) => {
    const { data: rows, error: queryError } = await supabase
      .from("leave_requests")
      .select(`
        *,
        profiles:requested_by (
          full_name
        )
      `)
      .eq("stream", stream)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Error fetching requests:", queryError);
      return;
    }
    setRequests((rows as any) ?? []);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // Check DB role to ensure correctness (metadata might be stale)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, stream, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "staff") {
        if (profile?.role === "admin") router.replace("/admin");
        else if (profile?.role === "pc") router.replace("/pc");
        else router.replace("/login");
        return;
      }

      const stream = profile.stream as Stream;
      setUserStream(stream);
      setUserId(user.id);
      setUserName(profile.full_name || user.email?.split('@')[0] || 'User');

      await fetchRequests(stream);
      setLoading(false);
    };

    load();
  }, [router]);

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
      status: "pending_pc",
      requested_by: userId,
      stream: userStream,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    await fetchRequests(userStream);

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
    await fetchRequests(userStream!);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/landing");
  };

  const stats = {
    total: requests.length,
    pendingPC: requests.filter(r => r.status === "pending_pc").length,
    pendingAdmin: requests.filter(r => r.status === "pending_admin").length,
    approved: requests.filter(r => r.status === "approved").length,
    declined: requests.filter(r => r.status === "declined").length,
  };

  const myRequests = requests.filter(r => r.requested_by === userId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8 animate-fade-in">
        {/* Header */}
        <header className="flex items-start sm:items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Advisor Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {getGreeting()}, <span className="font-semibold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">{userName}</span>! Manage student leave requests
            </p>
            {userStream && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Department:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStreamColor(userStream)}`}>
                  {userStream}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-all shadow-sm min-w-[100px]"
          >
            Sign out
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 transition-all shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-blue transition-all shadow-sm border-l-4 border-l-blue-500">
            <p className="text-xs text-blue-500 mb-1">Pending PC</p>
            <p className="text-3xl font-bold text-blue-500">{stats.pendingPC}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-amber transition-all shadow-sm border-l-4 border-l-amber-500">
            <p className="text-xs text-amber-500 mb-1">Pending Admin</p>
            <p className="text-3xl font-bold text-amber-500">{stats.pendingAdmin}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 hover:scale-105 hover:shadow-glow-green transition-all shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-xs text-emerald-500 mb-1">Approved</p>
            <p className="text-3xl font-bold text-emerald-500">{stats.approved}</p>
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Request Form */}
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-lg h-fit">
            <h2 className="mb-6 text-xl font-bold text-foreground">Request Leave for Student</h2>

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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    {request.attachment_url && (
                      <a
                        href={request.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline"
                      >
                        📎 View attachment
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
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
