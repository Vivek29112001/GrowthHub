import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Loader2, Target, Trophy, Sparkles, LogIn, LogOut, Lock } from "lucide-react";

import { fetchRoadmap, updateTopic, type Topic } from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Engineer Roadmap Tracker — Vivek Sharma" },
      {
        name: "description",
        content:
          "A 120-day learning map to MAANG/FAANG-level AI Engineer readiness. Track every milestone, topic, and project in one place.",
      },
      { property: "og:title", content: "AI Engineer Roadmap Tracker — Vivek Sharma" },
      {
        property: "og:description",
        content: "Digital tracker for a 120-day AI Engineer learning roadmap.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["roadmap"], queryFn: fetchRoadmap }),
  component: RoadmapPage,
});

// Target: 120 days from project start (Jul 19, 2026 per goal)
const START_DATE = new Date("2026-07-19T00:00:00Z");
const TARGET_DATE = new Date(START_DATE.getTime() + 120 * 24 * 60 * 60 * 1000);

function daysLeft() {
  const now = new Date();
  const ms = TARGET_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function RoadmapPage() {
  const { data } = useQuery({ queryKey: ["roadmap"], queryFn: fetchRoadmap });
  const qc = useQueryClient();
  const { user } = useAuth();
  const nav = useNavigate();
  const canEdit = !!user;

  const mutate = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Topic> }) => updateTopic(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["roadmap"] });
      const prev = qc.getQueryData<{ topics: Topic[] }>(["roadmap"]);
      qc.setQueryData<any>(["roadmap"], (old: any) =>
        old ? { ...old, topics: old.topics.map((t: Topic) => (t.id === id ? { ...t, ...patch } : t)) } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(["roadmap"], ctx.prev),
  });

  const milestones = data?.milestones ?? [];
  const topics = data?.topics ?? [];

  const stats = useMemo(() => {
    const total = topics.length;
    const done = topics.filter((t) => t.done).length;
    const inProg = topics.filter((t) => !t.done && t.in_progress).length;
    return { total, done, inProg, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [topics]);

  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                120-day learning map
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                AI Engineer Roadmap Tracker
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                Vivek Sharma · MAANG/FAANG-level AI Engineer readiness. Every milestone, every topic —
                tracked digitally, saved to your database.
              </p>
            </div>
            <div className="flex-none">
              {user ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <LogIn className="h-3.5 w-3.5" /> Sign in to edit
                </Link>
              )}
            </div>
          </div>


          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Target className="h-4 w-4" />}
              label="Target date"
              value={TARGET_DATE.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              sub={`${daysLeft()} days left`}
            />
            <StatCard
              icon={<Trophy className="h-4 w-4" />}
              label="Topics complete"
              value={`${stats.done} / ${stats.total}`}
              sub={`${stats.inProg} in progress`}
            />
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4" /> Overall progress
                </span>
                <span className="font-semibold text-foreground">{stats.pct}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Milestones */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-lg font-semibold">Milestones</h2>
        <div className="space-y-3">
          {milestones.map((m) => {
            const mTopics = topics.filter((t) => t.milestone_id === m.id);
            const done = mTopics.filter((t) => t.done).length;
            const pct = mTopics.length ? Math.round((done / mTopics.length) * 100) : 0;
            const isOpen = activeMilestone === m.id;
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => setActiveMilestone(isOpen ? null : m.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-accent/40"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
                    {m.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-base font-semibold">{m.title}</h3>
                      <span className="text-xs text-muted-foreground">{m.outcome}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct === 100 ? "bg-emerald-500" : "bg-primary",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                        {done}/{mTopics.length}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-background/50 px-5 py-4">
                    {!canEdit && (
                      <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Viewing only.</span>
                        <button
                          onClick={() => nav({ to: "/auth" })}
                          className="ml-auto font-medium text-foreground hover:underline"
                        >
                          Sign in to edit
                        </button>
                      </div>
                    )}
                    <TopicList
                      topics={mTopics}
                      canEdit={canEdit}
                      onToggle={(t) =>
                        mutate.mutate({ id: t.id, patch: { done: !t.done, in_progress: false } })
                      }
                      onProgress={(t) =>
                        mutate.mutate({
                          id: t.id,
                          patch: { in_progress: !t.in_progress, done: false },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="mt-14 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          Built for Vivek · Data persists in Lovable Cloud.
        </footer>
      </main>
    </div>
  );
}


function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function TopicList({
  topics,
  onToggle,
  onProgress,
  canEdit,
}: {
  topics: Topic[];
  onToggle: (t: Topic) => void;
  onProgress: (t: Topic) => void;
  canEdit: boolean;
}) {
  // Group by group_label
  const groups = new Map<string, Topic[]>();
  for (const t of topics) {
    const k = t.group_label ?? "";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          {label && (
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          )}
          <div className="grid gap-1.5 sm:grid-cols-2">
            {items.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition hover:border-border hover:bg-accent/40",
                  t.done && "opacity-70",
                )}
              >
                <button
                  aria-label={t.done ? "Mark not done" : "Mark done"}
                  onClick={() => onToggle(t)}
                  disabled={!canEdit}
                  className="flex-none text-muted-foreground transition hover:text-primary disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
                >
                  {t.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    t.done && "line-through text-muted-foreground",
                  )}
                >
                  {t.title}
                </span>
                <button
                  onClick={() => onProgress(t)}
                  disabled={!canEdit}
                  className={cn(
                    "flex-none rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition disabled:cursor-not-allowed",
                    t.in_progress
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary",
                  )}
                >
                  {t.in_progress ? "In progress" : "Start"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
