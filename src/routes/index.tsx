import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Target,
  Trophy,
  Loader2,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

import {
  fetchRoadmap,
  updateTopic,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  createTopic,
  deleteTopic,
  type Topic,
  type Milestone,
} from "@/lib/roadmap";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { seedDefaultRoadmapIfEmpty } from "@/lib/default-roadmap";
import { AI_ENGINEER_ROADMAP, seedRoadmap } from "@/lib/ai-engineer-roadmap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My GrowthHub" },
      {
        name: "description",
        content: "Build, edit, and track your own personal learning or project roadmap.",
      },
      { property: "og:title", content: "My GrowthHub" },
      { property: "og:description", content: "Your personal digital roadmap tracker." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

function Dashboard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["roadmap"], queryFn: fetchRoadmap });
  const [seeding, setSeeding] = useState<null | "ai" | "sample">(null);

  async function pickRoadmap(kind: "ai" | "sample") {
    setSeeding(kind);
    try {
      if (kind === "ai") {
        await seedRoadmap(AI_ENGINEER_ROADMAP);
      } else {
        await seedDefaultRoadmapIfEmpty();
      }
      qc.invalidateQueries({ queryKey: ["roadmap"] });
    } catch (e) {
      console.error("Seed failed:", e);
    } finally {
      setSeeding(null);
    }
  }

  const milestones = data?.milestones ?? [];
  const topics = data?.topics ?? [];



  const stats = useMemo(() => {
    const total = topics.length;
    const done = topics.filter((t) => t.done).length;
    const inProg = topics.filter((t) => !t.done && t.in_progress).length;
    return { total, done, inProg, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [topics]);

  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["roadmap"] });

  const toggleTopic = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Topic> }) => updateTopic(id, patch),
    onSuccess: invalidate,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-gradient-to-b from-secondary/40 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Your personal roadmap
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                My GrowthHub
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Add milestones and topics for any field — learning, projects, fitness, business. Everything
                saves to your private database.
              </p>
            </div>
          </div>


          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard icon={<Target className="h-4 w-4" />} label="Milestones" value={`${milestones.length}`} />
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Milestones</h2>
          <button
            onClick={() => setShowAddMilestone(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add milestone
          </button>
        </div>

        {showAddMilestone && (
          <MilestoneForm
            defaultOrder={milestones.length + 1}
            onCancel={() => setShowAddMilestone(false)}
            onSaved={() => {
              setShowAddMilestone(false);
              invalidate();
            }}
          />
        )}

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : milestones.length === 0 && !showAddMilestone ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No milestones yet. Click <b>Add milestone</b> to start your roadmap.
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => {
              const mTopics = topics.filter((t) => t.milestone_id === m.id);
              const done = mTopics.filter((t) => t.done).length;
              const pct = mTopics.length ? Math.round((done / mTopics.length) * 100) : 0;
              const isOpen = activeMilestone === m.id;
              return (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  topics={mTopics}
                  isOpen={isOpen}
                  onToggleOpen={() => setActiveMilestone(isOpen ? null : m.id)}
                  done={done}
                  pct={pct}
                  onChanged={invalidate}
                  onToggleTopic={(t) =>
                    toggleTopic.mutate({ id: t.id, patch: { done: !t.done, in_progress: false } })
                  }
                  onProgressTopic={(t) =>
                    toggleTopic.mutate({
                      id: t.id,
                      patch: { in_progress: !t.in_progress, done: false },
                    })
                  }
                />
              );
            })}
          </div>
        )}

        <footer className="mt-14 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          Your data · Private to your account.
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

function MilestoneForm({
  defaultOrder,
  initial,
  onCancel,
  onSaved,
}: {
  defaultOrder: number;
  initial?: Milestone;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [outcome, setOutcome] = useState(initial?.outcome ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      if (initial) {
        await updateMilestone(initial.id, { title: title.trim(), outcome: outcome.trim() || null });
      } else {
        await createMilestone({ title: title.trim(), outcome: outcome.trim() || undefined, order_index: defaultOrder });
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          autoFocus
          placeholder="Milestone title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          placeholder="Outcome (optional)"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={save}
          disabled={busy || !title.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" /> {initial ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}

function MilestoneRow({
  milestone,
  topics,
  isOpen,
  onToggleOpen,
  done,
  pct,
  onChanged,
  onToggleTopic,
  onProgressTopic,
}: {
  milestone: Milestone;
  topics: Topic[];
  isOpen: boolean;
  onToggleOpen: () => void;
  done: number;
  pct: number;
  onChanged: () => void;
  onToggleTopic: (t: Topic) => void;
  onProgressTopic: (t: Topic) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  async function addTopic() {
    if (!newTopic.trim()) return;
    await createTopic({
      milestone_id: milestone.id,
      title: newTopic.trim(),
      order_index: topics.length + 1,
    });
    setNewTopic("");
    setAddingTopic(false);
    onChanged();
  }

  async function removeMilestone() {
    if (!confirm(`Delete "${milestone.title}" and all its topics?`)) return;
    await deleteMilestone(milestone.id);
    onChanged();
  }

  if (editing) {
    return (
      <MilestoneForm
        defaultOrder={milestone.order_index}
        initial={milestone}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4 px-5 py-4">
        <button
          onClick={onToggleOpen}
          className="flex flex-1 items-center gap-4 text-left"
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
            {milestone.order_index}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-base font-semibold">{milestone.title}</h3>
              {milestone.outcome && (
                <span className="text-xs text-muted-foreground">{milestone.outcome}</span>
              )}
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
                {done}/{topics.length}
              </span>
            </div>
          </div>
        </button>
        <div className="flex flex-none items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={removeMilestone}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background/50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Topics
            </div>
            <button
              onClick={() => setAddingTopic((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-accent"
            >
              <Plus className="h-3 w-3" /> Add topic
            </button>
          </div>

          {addingTopic && (
            <div className="mb-3 flex gap-2">
              <input
                autoFocus
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTopic()}
                placeholder="New topic title"
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addTopic}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Add
              </button>
            </div>
          )}

          {topics.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No topics yet. Add your first one above.
            </div>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {topics.map((t) => (
                <TopicItem
                  key={t.id}
                  topic={t}
                  onToggle={() => onToggleTopic(t)}
                  onProgress={() => onProgressTopic(t)}
                  onDelete={async () => {
                    await deleteTopic(t.id);
                    onChanged();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopicItem({
  topic,
  onToggle,
  onProgress,
  onDelete,
}: {
  topic: Topic;
  onToggle: () => void;
  onProgress: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition hover:border-border hover:bg-accent/40",
        topic.done && "opacity-70",
      )}
    >
      <button
        aria-label={topic.done ? "Mark not done" : "Mark done"}
        onClick={onToggle}
        className="flex-none text-muted-foreground transition hover:text-primary"
      >
        {topic.done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <span
        className={cn(
          "flex-1 truncate text-sm",
          topic.done && "line-through text-muted-foreground",
        )}
      >
        {topic.title}
      </span>
      <button
        onClick={onProgress}
        className={cn(
          "flex-none rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition",
          topic.in_progress
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary",
        )}
      >
        {topic.in_progress ? "In progress" : "Start"}
      </button>
      <button
        onClick={onDelete}
        className="flex-none rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete topic"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
