"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      // Prefer role stored in user metadata
      const metaRole = (user.user_metadata as any)?.role;
      if (metaRole === "admin") {
        router.replace("/admin");
        return;
      }
      if (metaRole === "staff") {
        router.replace("/staff");
        return;
      }
      // Fallback to profiles table if metadata missing
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const dbRole = profile?.role;
      if (dbRole === "admin") router.replace("/admin");
      else if (dbRole === "staff") router.replace("/staff");
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setError("Unable to get user after sign in.");
        setLoading(false);
        return;
      }
      const metaRole = (user.user_metadata as any)?.role;
      if (metaRole === "admin") {
        router.replace("/admin");
      } else if (metaRole === "staff") {
        router.replace("/staff");
      } else {
        // fallback to db
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "admin") router.replace("/admin");
        else router.replace("/staff");
      }
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: name },
      },
    });
    if (signUpError) {
      const message = signUpError.message ?? "Unable to sign up";
      const status = (signUpError as any).status;

      // Supabase security / rate limit (HTTP 429)
      if (
        status === 429 ||
        message.toLowerCase().includes("security purposes") ||
        message.toLowerCase().includes("too many requests")
      ) {
        setError(
          "You have tried to sign up too many times. Please wait a bit and try again, or use Sign in if you already created this account."
        );
        setLoading(false);
        return;
      }

      // User already registered with this email
      if (message.toLowerCase().includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
        setMode("signin");
        setLoading(false);
        return;
      }

      setError(message);
      setLoading(false);
      return;
    }
    const user = signUpData.user;
    if (!user) {
      setError("Unable to create user.");
      setLoading(false);
      return;
    }
    // No profile row insertion to avoid RLS issues. Role is stored in user_metadata.
    setLoading(false);
    setMessage("Account created! Check your email and confirm before signing in.");
    setMode("signin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <div className="w-full max-w-md rounded-lg bg-neutral-800 p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold text-neutral-100">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h1>
        <div className="mb-4 flex justify-center gap-4">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signin" ? "bg-purple-600 text-white" : "bg-neutral-700 text-neutral-300"}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signup" ? "bg-purple-600 text-white" : "bg-neutral-700 text-neutral-300"}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-300">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
              />
              <div className="mt-3">
                <label className="mb-1 block text-sm font-medium text-neutral-300">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value === "admin" ? "admin" : "staff")
                  }
                  className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400 bg-neutral-800"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-md border border-neutral-600 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
