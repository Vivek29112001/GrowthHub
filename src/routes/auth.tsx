import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Sparkles, Target, Award, Clock, ArrowRight, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — GrowthHub" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [loading, user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          nav({ to: "/" });
        } else {
          setSentTo(email);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      }
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a12] text-white">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-600/40 blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-fuchsia-600/30 blur-[120px] animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-violet-500/30 blur-[120px] animate-pulse"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center lg:py-16">
        {/* Left: brand + pitch */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Your 120-day AI Engineer journey
          </div>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Grow every day.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              Track every win.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/60">
            GrowthHub is your personal growth OS — roadmap, study streaks, certificates,
            interviews and an AI coach that actually knows your progress.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: Target, title: "Custom roadmap", desc: "Edit or build your own path" },
              { icon: Clock, title: "Study streaks", desc: "Log hours, keep the fire" },
              { icon: Award, title: "Certificates", desc: "Every proof in one place" },
              { icon: Sparkles, title: "AI Coach", desc: "Guidance based on your data" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-white/50">{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="relative mx-auto w-full max-w-md">
          {/* glowing border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/40 to-violet-500/60 opacity-70 blur-[2px]" />
          <div className="relative rounded-2xl border border-white/10 bg-[#0f0f1a]/90 p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30">
                GH
              </div>
              <div>
                <div className="text-sm font-semibold text-white">GrowthHub</div>
                <div className="text-[11px] uppercase tracking-widest text-white/40">
                  Personal Growth OS
                </div>
              </div>
            </div>

            {sentTo ? (
              <div className="mt-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-fuchsia-300 ring-1 ring-white/10">
                  <Mail className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">Check your Gmail</h2>
                <p className="mt-2 text-sm text-white/60">
                  We sent a confirmation link to{" "}
                  <span className="font-medium text-white">{sentTo}</span>. Open your Gmail
                  inbox and click the link to activate your account.
                </p>
                <button
                  onClick={() => {
                    setSentTo(null);
                    setMode("signin");
                  }}
                  className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {/* mode tabs */}
                <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/10">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`relative rounded-lg py-2 text-xs font-semibold transition ${
                        mode === m
                          ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow shadow-fuchsia-500/30"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>

                <h2 className="mt-6 text-xl font-semibold text-white">
                  {mode === "signin" ? "Welcome back" : "Start your journey"}
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  {mode === "signin"
                    ? "Sign in to continue tracking your growth."
                    : "Create an account to build your personal roadmap."}
                </p>

                <form onSubmit={submit} className="mt-6 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-fuchsia-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-fuchsia-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-fuchsia-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-fuchsia-500/20"
                    />
                  </div>

                  {err && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {err}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:shadow-fuchsia-500/50 disabled:opacity-60"
                  >
                    <span className="relative inline-flex items-center justify-center gap-2">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {mode === "signin" ? "Sign in" : "Create account"}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-white/50">
                  {mode === "signin" ? (
                    <>
                      New here?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="font-medium text-fuchsia-300 hover:text-fuchsia-200"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setMode("signin")}
                        className="font-medium text-fuchsia-300 hover:text-fuchsia-200"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] text-white/30">
            By continuing you agree to keep growing 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
