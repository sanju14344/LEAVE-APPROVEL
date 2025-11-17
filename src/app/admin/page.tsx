"use client";

import { useEffect, useState } from "react";
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
  reviewed_at: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
      if (metaRole !== "admin") {
        if (metaRole === "staff") router.replace("/staff");
        else router.replace("/login");
        return;
      }
      const { data: rows, error: queryError } = await supabase
        .from("leave_requests")
        .select("id, student_name, student_class, from_date, to_date, reason, attachment_url, status, created_at, reviewed_at")
        .order("created_at", { ascending: false });
      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }
      setRequests(rows ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const updateStatus = async (id: string, status: "approved" | "declined") => {
    setError(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      router.replace("/login");
      return;
    }
    const { error: updateError } = await supabase
      .from("leave_requests")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    const { data: rows } = await supabase
      .from("leave_requests")
      .select("id, student_name, student_class, from_date, to_date, reason, status, created_at, reviewed_at")
      .order("created_at", { ascending: false });
    setRequests(rows ?? []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-900 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-100">Admin dashboard</h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            Sign out
          </button>
        </header>
        <section className="rounded-lg bg-neutral-800 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-neutral-100">All leave requests</h2>
          {loading ? (
            <p className="text-sm text-neutral-400">Loading requests...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-neutral-400">No leave requests found.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-col gap-2 rounded-md border border-neutral-600 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-neutral-100">
                      {request.student_name} ({request.student_class})
                    </p>
                    <p className="text-neutral-300">
                      {request.from_date} → {request.to_date}
                    </p>
                    {request.reason && (
                      <p className="text-neutral-400">{request.reason}</p>
                    )}
                    {request.attachment_url && (
                      <a
                        href={request.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                      >
                        View attachment
                      </a>
                    )}
                    <p className="text-xs text-zinc-400">
                      Submitted at {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.reviewed_at && (
                      <p className="text-xs text-zinc-400">
                        Reviewed at {new Date(request.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${request.status === "approved" ? "bg-emerald-100 text-emerald-700" : request.status === "declined" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {request.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "approved")}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "declined")}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
