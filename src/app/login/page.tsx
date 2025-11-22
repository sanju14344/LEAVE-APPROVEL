"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "signin" | "signup";
type Stream = "CSE" | "ECE" | "EEE" | "MECH" | "CIVIL";

const STREAMS: Stream[] = ["CSE", "ECE", "EEE", "MECH", "CIVIL"];

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

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"staff" | "pc" | "admin">("staff");
  const [stream, setStream] = useState<Stream>("CSE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      const metaRole = (user.user_metadata as any)?.role;
      if (metaRole === "admin") {
        router.replace("/admin");
        return;
      }
      if (metaRole === "pc") {
        router.replace("/pc");
        return;
      }
      if (metaRole === "staff") {
        router.replace("/staff");
        return;
      }
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

      // SELF-HEALING: Check if profile exists, if not create it
      let { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        console.log("Profile missing for user, creating one now...");
        // Create missing profile
        const meta = user.user_metadata || {};
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email!,
            full_name: meta.full_name || user.email!,
            role: meta.role || "staff",
            stream: meta.stream || "CSE"
          });

        if (createError) {
          console.error("Failed to auto-create profile:", createError);
          // Continue anyway, maybe the trigger worked in parallel
        }

        // Fetch again
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        profile = newProfile;
      }

      const metaRole = (user.user_metadata as any)?.role;
      if (metaRole === "admin") {
        router.replace("/admin");
      } else if (metaRole === "pc") {
        router.replace("/pc");
      } else if (metaRole === "staff") {
        router.replace("/staff");
      } else {
        if (profile?.role === "admin") router.replace("/admin");
        else if (profile?.role === "pc") router.replace("/pc");
        else router.replace("/staff");
      }
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: name, stream },
      },
    });
    if (signUpError) {
      const message = signUpError.message ?? "Unable to sign up";
      const status = (signUpError as any).status;

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

    // WORKAROUND: Manually create profile entry if trigger fails
    // This ensures the profile is created even if the database trigger has permission issues
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: email,
          full_name: name,
          role: role,
          stream: stream,
        });

      // Only log profile errors, don't fail the signup
      if (profileError) {
        console.warn("Profile creation warning:", profileError.message);
        // The trigger might have already created it, so ignore "duplicate key" errors
        if (!profileError.message.toLowerCase().includes("duplicate")) {
          console.error("Profile creation failed, but signup succeeded:", profileError);
        }
      }
    } catch (profileException) {
      // Don't fail signup even if profile creation fails
      console.warn("Profile creation exception (signup still succeeded):", profileException);
    }

    setLoading(false);
    setMessage("Account created! Check your email and confirm before signing in.");
    setMode("signin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your dashboard"
                : "Join the modern leave management system"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-lg">
            <button
              type="button"
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${mode === "signin"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${mode === "signup"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(event) => {
                        const val = event.target.value;
                        setRole(val === "admin" ? "admin" : val === "pc" ? "pc" : "staff");
                      }}
                      className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                    >
                      <option value="staff">Advisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Department
                    </label>
                    <select
                      value={stream}
                      onChange={(event) => setStream(event.target.value as Stream)}
                      className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all cursor-pointer"
                    >
                      {STREAMS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stream Preview Badge */}
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <span className="text-xs text-muted-foreground">Your department:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStreamColor(stream)}`}>
                    {stream}
                  </span>
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg bg-input border border-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-500">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-lg hover:shadow-glow hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all"
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
    </div>
  );
}
