import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, User as UserIcon, KeyRound, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, upsertProfile, type Profile } from "@/lib/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — GrowthHub" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      setProfile(p);
      setFullName(p?.full_name ?? "");
      setBio(p?.bio ?? "");
      setAvatarUrl(p?.avatar_url ?? "");
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setErr(null);
    setSavedMsg(null);
    try {
      await upsertProfile(user.id, {
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setSavedMsg("Profile saved");
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (e: any) {
      setErr(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword.length < 6) return setPwErr("At least 6 characters");
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg("Password updated");
      setNewPassword("");
      setTimeout(() => setPwMsg(null), 2500);
    } catch (e: any) {
      setPwErr(e.message ?? "Could not update password");
    } finally {
      setPwBusy(false);
    }
  }

  const initials =
    (fullName || user?.email || "U")
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <AppLayout>
      <main className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-fuchsia-500/10 to-transparent blur-3xl" />
        <h1 className="text-3xl font-bold gradient-text">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your details and manage your account.
        </p>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-fuchsia-500/30">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{initials}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {fullName || "Unnamed traveler"}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Vivek Sharma"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Avatar URL
              </label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                About you
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="A short bio about your goals and background…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>

            {err && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {err}
              </div>
            )}
            {savedMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> {savedMsg}
              </div>
            )}

            <div>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-violet-500 px-4 py-2 text-sm font-semibold shadow-lg shadow-fuchsia-500/30 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-fuchsia-300" />
            <h2 className="text-base font-semibold">Change password</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter a new password to update it instantly.
          </p>
          <form onSubmit={changePassword} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              minLength={6}
              placeholder="New password (min 6)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20"
            />
            <button
              type="submit"
              disabled={pwBusy || !newPassword}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
            >
              {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </button>
          </form>
          {pwErr && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {pwErr}
            </div>
          )}
          {pwMsg && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> {pwMsg}
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <UserIcon className="h-3.5 w-3.5" />
          Signed in as {user?.email}
        </div>
      </main>
    </AppLayout>
  );
}
