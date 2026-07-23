import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — GrowthHub" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts a recovery token in the URL hash and creates a temp session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters");
    if (password !== confirm) return setErr("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => nav({ to: "/" }), 1500);
    } catch (e: any) {
      setErr(e.message ?? "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-600/40 blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 h-[420px] w-[420px] rounded-full bg-fuchsia-600/30 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full">
          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/40 to-violet-500/60 opacity-70 blur-[2px]" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0f0f1a]/90 p-8 backdrop-blur-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold">Set a new password</h1>
              <p className="mt-1 text-sm text-white/50">
                Enter your new password below to finish resetting your account.
              </p>

              {done ? (
                <div className="mt-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                  <p className="mt-3 text-sm text-white/70">
                    Password updated. Redirecting…
                  </p>
                </div>
              ) : !ready ? (
                <div className="mt-8 flex items-center gap-2 text-sm text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying reset link…
                </div>
              ) : (
                <form onSubmit={submit} className="mt-6 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      New password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
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
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-violet-500 py-2.5 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Update password <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-5 text-center text-xs text-white/50">
                <Link to="/auth" className="text-fuchsia-300 hover:text-fuchsia-200">
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
