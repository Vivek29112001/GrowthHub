import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BarChart3, Calendar, Clock, Award, Briefcase, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { fetchRoadmap } from "@/lib/roadmap";
import { listStudySessions } from "@/lib/study";
import { listCertificates } from "@/lib/certificates";
import { listInterviews } from "@/lib/interviews";

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "Monthly Insights — Roadmap Tracker" }] }),
  component: () => (
    <AppLayout>
      <InsightsPage />
    </AppLayout>
  ),
});

function InsightsPage() {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current, -1 = last

  const { data: roadmap } = useQuery({ queryKey: ["roadmap"], queryFn: fetchRoadmap });
  const { data: study = [] } = useQuery({ queryKey: ["study"], queryFn: () => listStudySessions(500) });
  const { data: certs = [] } = useQuery({ queryKey: ["certificates"], queryFn: listCertificates });
  const { data: interviews = [] } = useQuery({ queryKey: ["interviews"], queryFn: listInterviews });

  const range = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
    return {
      start,
      end,
      label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [monthOffset]);

  const inMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= range.start && d <= new Date(range.end.getTime() + 86400000);
  };

  const monthStudy = study.filter((s) => inMonth(s.session_date));
  const monthCerts = certs.filter((c) => c.issue_date && inMonth(c.issue_date));
  const monthInterviews = interviews.filter((i) => inMonth(i.interview_date));
  const monthMistakes = monthInterviews.filter((i) => i.mistakes?.trim());

  const totalMinutes = monthStudy.reduce((s, x) => s + x.minutes, 0);
  const studyDays = new Set(monthStudy.map((s) => s.session_date)).size;
  const topicsDone = roadmap?.topics.filter((t) => t.done).length ?? 0;
  const topicsTotal = roadmap?.topics.length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6" /> Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A month-end look at everything you did.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent"
          >
            ←
          </button>
          <div className="min-w-[9rem] rounded-md bg-secondary px-3 py-1 text-center text-sm font-semibold">
            {range.label}
          </div>
          <button
            onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
            disabled={monthOffset === 0}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat icon={<Clock className="h-4 w-4 text-primary" />} label="Study hours" value={`${(totalMinutes / 60).toFixed(1)}h`} sub={`${studyDays} active days`} />
        <BigStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} label="Roadmap progress" value={`${topicsDone}/${topicsTotal}`} sub="topics complete overall" />
        <BigStat icon={<Award className="h-4 w-4 text-amber-500" />} label="Certificates earned" value={`${monthCerts.length}`} />
        <BigStat icon={<Briefcase className="h-4 w-4 text-blue-500" />} label="Interviews given" value={`${monthInterviews.length}`} sub={`${monthMistakes.length} with logged mistakes`} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interviews this month</h2>
        {monthInterviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No interviews logged in {range.label}.
          </div>
        ) : (
          <div className="space-y-2">
            {monthInterviews.map((iv) => (
              <div key={iv.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{iv.company} <span className="text-xs text-muted-foreground">· {iv.round || "—"}</span></div>
                  <span className="text-xs text-muted-foreground">{iv.interview_date} · {iv.outcome}</span>
                </div>
                {iv.mistakes && (
                  <div className="mt-2 rounded-md bg-destructive/10 p-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Mistakes: </span>
                    {iv.mistakes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Study log this month</h2>
        {monthStudy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No study sessions in {range.label}.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              You studied on <b>{studyDays}</b> different days for a total of <b>{(totalMinutes / 60).toFixed(1)} hours</b>.
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function BigStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
