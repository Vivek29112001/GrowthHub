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
  Menu,
  X,
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
  const [drawer, setDrawer] = useState(false);
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

  // Close drawer on route change
  useEffect(() => {
    setDrawer(false);
  }, [loc.pathname]);

  // Lock scroll when drawer open
  useEffect(() => {
    if (drawer) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawer]);

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

  const Avatar = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const dims = size === "md" ? "h-10 w-10 text-xs" : "h-7 w-7 text-[11px]";
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white",
          dims,
        )}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">{initials}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-foreground">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition hover:bg-white/10"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2 transition hover:bg-white/10"
            >
              <Avatar />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f1a]/95 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar size="md" />
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

      {/* Mobile side drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          drawer ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!drawer}
      >
        {/* Backdrop */}
        <div
          onClick={() => setDrawer(false)}
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            drawer ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Panel */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-white/10 bg-[#0f0f1a]/95 shadow-2xl backdrop-blur-xl transition-transform duration-300",
            drawer ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <Link to="/" onClick={() => setDrawer(false)} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30">
                GH
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">GrowthHub</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Personal Growth OS
                </div>
              </div>
            </Link>
            <button
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-white/5 p-4">
            <div className="flex items-center gap-3">
              <Avatar size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Navigate
            </div>
            <div className="flex flex-col gap-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = loc.pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setDrawer(false)}
                    className={cn(
                      "group relative inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "text-white"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-0 -z-10 rounded-xl gradient-bg opacity-90 shadow-lg shadow-fuchsia-500/30" />
                    )}
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Account
            </div>
            <div className="flex flex-col gap-1">
              <Link
                to="/profile"
                onClick={() => setDrawer(false)}
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={async () => {
                  setDrawer(false);
                  await supabase.auth.signOut();
                  nav({ to: "/auth", replace: true });
                }}
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </nav>
        </aside>
      </div>

      {children}
    </div>
  );
}
