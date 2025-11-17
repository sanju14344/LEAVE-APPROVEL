"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type LeaveRequest = {
  id: string;
  student_name: string;
  student_class: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  attachment_url?: string | null;
  status: string;
  created_at: string;
};

export default function StaffPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const metaRole = (user.user_metadata as any)?.role;
      if (metaRole !== "staff") {
        if (metaRole === "admin") router.replace("/admin");
        else router.replace("/login");
        return;
      }
      const { data: rows, error: queryError } = await supabase
        .from("leave_requests")
        .select("id, student_name, student_class, from_date, to_date, reason, attachment_url, status, created_at")
        .order("created_at", { ascending: false });
      if (queryError) {
        setError(queryError.message);
        return;
      }
      setRequests(rows ?? []);
    };
    load();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      router.replace("/login");
      setLoading(false);
      return;
    }
    let attachment_url: string | null = null;
    if (file) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("leave_attachments")
        .upload(filePath, file);
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("leave_attachments").getPublicUrl(filePath);
      attachment_url = publicUrl.publicUrl;
    }

    const { error: insertError } = await supabase.from("leave_requests").insert({
      student_name: studentName,
      student_class: studentClass,
      from_date: fromDate,
      to_date: toDate,
      reason,
      attachment_url,
      status: "pending",
      requested_by: user.id,
    });
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from("leave_requests")
      .select("id, student_name, student_class, from_date, to_date, reason, attachment_url, status, created_at")
      .order("created_at", { ascending: false });
    setRequests(rows ?? []);
    setStudentName("");
    setStudentClass("");
    setFromDate("");
    setToDate("");
    setReason("");
    setFile(null);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-900 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-100">Staff dashboard</h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            Sign out
          </button>
        </header>
        <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <form onSubmit={handleSubmit} className="rounded-lg bg-neutral-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-neutral-100">Request leave for student</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-neutral-300">
                Student name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                required
                className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 placeholder-zinc-400 outline-none focus:border-zinc-900"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-neutral-300">
                Class
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(event) => setStudentClass(event.target.value)}
                required
                className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 placeholder-zinc-400 outline-none focus:border-zinc-900"
              />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  From date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  required
                  className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 placeholder-zinc-400 outline-none focus:border-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  To date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  required
                  className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 placeholder-zinc-400 outline-none focus:border-zinc-900"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-neutral-300">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 placeholder-zinc-400 outline-none focus:border-zinc-900"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-neutral-300">
                Attach letter/report (optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setFileName(f ? f.name : "");
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
                >
                  Choose file
                </label>
                {fileName && <span className="truncate text-sm text-neutral-300 max-w-[200px]">{fileName}</span>}
              </div>
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Submitting..." : "Submit leave request"}
            </button>
          </form>
          <div className="rounded-lg bg-neutral-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-neutral-100">My leave requests</h2>
            {requests.length === 0 ? (
              <p className="text-sm text-neutral-400">No leave requests yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col rounded-md border border-neutral-700 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-100">
                        {request.student_name} ({request.student_class})
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${request.status === "approved" ? "bg-emerald-100 text-emerald-700" : request.status === "declined" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-neutral-300">
                      {request.from_date} → {request.to_date}
                    </p>
                    {request.reason && (
                      <p className="mt-1 text-neutral-400">{request.reason}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-400">
                      Submitted at {new Date(request.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
