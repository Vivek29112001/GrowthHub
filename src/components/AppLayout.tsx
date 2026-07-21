import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LogOut, Target, Award, Briefcase, Clock, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen text-foreground">
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30">
              GH
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition group-hover:opacity-100" />
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

          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}
