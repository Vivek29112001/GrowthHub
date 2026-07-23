import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LogOut,
  Target,
  Award,
  Briefcase,
  Clock,
  BarChart3,
  Loader2,
  User as UserIcon,
  KeyRound,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getProfile, type Profile } from "@/lib/profile";

const NAV = [
  { to: "/", label: "Roadmap", icon: Target },
  { to: "/study", label: "Study", icon: Clock },
  { to: "/certificates", label: "Certificates", icon: Award },
  { to: "/interviews", label: "Interviews", icon: Briefcase },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(setProfile).catch(() => {});
  }, [user, loc.pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "You";
  const initials =
    (profile?.full_name || user.email || "U")
      .split(/[\s@.]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="min-h-screen text-foreground">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30">
              GH
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-none">GrowthHub</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Personal Growth OS
              </div>
            </div>
          </Link>

          <div className="mx-2 hidden h-6 w-px bg-white/10 sm:block" />

          <div className="flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = loc.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                    active
                      ? "text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 -z-10 rounded-lg gradient-bg opacity-90 shadow-lg shadow-fuchsia-500/30" />
                  )}
                  <Icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2 transition hover:bg-white/10"
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-bold text-white">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {initials}
                  </div>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f1a]/95 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  {profile?.bio && (
                    <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
                      {profile.bio}
                    </p>
                  )}
                </div>
                <div className="p-1">
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground/90 hover:bg-white/5"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    View & edit profile
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground/90 hover:bg-white/5"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Change password
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground/90 hover:bg-white/5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Account settings
                  </Link>
                </div>
                <div className="border-t border-white/5 p-1">
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await supabase.auth.signOut();
                      nav({ to: "/auth", replace: true });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
