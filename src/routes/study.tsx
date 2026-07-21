import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Flame, Clock, Trophy, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  listStudySessions,
  addStudySession,
  deleteStudySession,
  computeStreaks,
  last30DaysBuckets,
} from "@/lib/study";

export const Route = createFileRoute("/study")({
  head: () => ({ meta: [{ title: "Study Tracker — GrowthHub" }] }),
  component: () => (
    <AppLayout>
      <StudyPage />
    </AppLayout>
  ),
});

function StudyPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["study"], queryFn: () => listStudySessions() });
  const [minutes, setMinutes] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => computeStreaks(data), [data]);
  const buckets = useMemo(() => last30DaysBuckets(data), [data]);
  const maxMin = Math.max(60, ...buckets.map((b) => b.minutes));

  const del = useMutation({
    mutationFn: deleteStudySession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study"] }),
  });

  async function log(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (!m || m <= 0) return;
    setBusy(true);
    try {
      await addStudySession({ minutes: m, topic, session_date: date });
      setMinutes("");
      setTopic("");
      qc.invalidateQueries({ queryKey: ["study"] });
    } finally {
      setBusy(false);
    }
  }

  const inp = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="gradient-text">Study Tracker</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Log every study session. Keep your streak alive.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
        <Stat icon={<Flame className="h-4 w-4 text-orange-500" />} label="Current streak" value={`${stats.current} 🔥`} />
        <Stat icon={<Trophy className="h-4 w-4 text-amber-500" />} label="Best streak" value={`${stats.best}`} />
        <Stat icon={<Clock className="h-4 w-4 text-primary" />} label="Total hours" value={`${(stats.totalMinutes / 60).toFixed(1)}h`} />
        <Stat icon={<Clock className="h-4 w-4 text-emerald-500" />} label="Today" value={`${stats.todayMinutes}m`} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:mt-8 sm:p-5">
        <div className="mb-3 text-sm font-semibold">Last 30 days</div>
        <div className="flex h-24 items-end gap-0.5 sm:gap-1">
          {buckets.map((b) => (
            <div key={b.date} title={`${b.date}: ${b.minutes} min`} className="flex-1">
              <div
                className="w-full rounded-t gradient-bg opacity-80"
                style={{ height: `${Math.max((b.minutes / maxMin) * 100, b.minutes ? 4 : 0)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={log} className="mt-6 rounded-xl border border-border bg-card p-4 sm:mt-8 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Log a session
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          <input type="number" min={1} max={720} required placeholder="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={inp} />
          <input placeholder="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} className={`${inp} sm:col-span-2`} />
        </div>
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={busy} className="rounded-md gradient-bg px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-fuchsia-500/20 hover:opacity-90 disabled:opacity-60">
            {busy ? "…" : "Log session"}
          </button>
        </div>
      </form>

      <div className="mt-6 sm:mt-8">
        <h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>
        {data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No sessions logged yet.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.slice(0, 30).map((s) => (
              <div key={s.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-sm sm:gap-3 sm:px-4">
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{s.session_date}</span>
                <span className="shrink-0 text-right tabular-nums font-medium">{s.minutes}m</span>
                <span className="min-w-0 truncate text-muted-foreground">{s.topic ?? "—"}</span>
                <button onClick={() => del.mutate(s.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold sm:text-2xl">{value}</div>
    </div>
  );
}
