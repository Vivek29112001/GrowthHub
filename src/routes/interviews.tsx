import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Building2, Calendar, Pencil, Check, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  listInterviews,
  addInterview,
  deleteInterview,
  updateInterview,
  type Interview,
} from "@/lib/interviews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interviews")({
  head: () => ({ meta: [{ title: "Interviews — GrowthHub" }] }),
  component: () => (
    <AppLayout>
      <InterviewsPage />
    </AppLayout>
  ),
});

const ROUNDS = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Round 4",
  "Round 5",
  "HR Round",
  "Final Round",
];
const OUTCOMES = ["Pending", "Passed", "Rejected", "Offer", "Ghosted"];
const OUTCOME_COLOR: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400",
  Passed: "bg-emerald-500/15 text-emerald-400",
  Rejected: "bg-destructive/15 text-destructive",
  Offer: "bg-primary/15 text-primary",
  Ghosted: "bg-muted text-muted-foreground",
};

function InterviewsPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["interviews"], queryFn: listInterviews });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] }),
  });

  const upd = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Interview> }) => updateInterview(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] }),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="gradient-text">Interviews</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track every company, round, mistake, and learning.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Log interview
        </button>
      </div>

      {open && <InterviewForm onDone={() => setOpen(false)} />}

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No interviews logged yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((iv) =>
            editingId === iv.id ? (
              <InterviewEditCard
                key={iv.id}
                interview={iv}
                onCancel={() => setEditingId(null)}
                onSaved={() => setEditingId(null)}
              />
            ) : (
              <div key={iv.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{iv.company}</h3>
                      {iv.role && <span className="text-sm text-muted-foreground">· {iv.role}</span>}
                      <select
                        value={iv.round || "Round 1"}
                        onChange={(e) => upd.mutate({ id: iv.id, patch: { round: e.target.value } })}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider outline-none"
                      >
                        {ROUNDS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <select
                        value={iv.outcome}
                        onChange={(e) => upd.mutate({ id: iv.id, patch: { outcome: e.target.value } })}
                        className={cn(
                          "ml-auto rounded-full border-0 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider outline-none",
                          OUTCOME_COLOR[iv.outcome] ?? "bg-muted",
                        )}
                      >
                        {OUTCOMES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {iv.interview_date}
                    </div>
                    <RoundTracker round={iv.round || "Round 1"} outcome={iv.outcome} />
                    {iv.questions && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Questions</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{iv.questions}</p>
                      </div>
                    )}
                    {iv.mistakes && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-destructive">Mistakes</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{iv.mistakes}</p>
                      </div>
                    )}
                    {iv.learnings && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Learnings</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{iv.learnings}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {iv.outcome !== "Rejected" && (
                      <button
                        onClick={() => setEditingId(iv.id)}
                        className="text-muted-foreground transition hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => confirm(`Delete interview at ${iv.company}?`) && del.mutate(iv.id)}
                      className="text-muted-foreground transition hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </main>
  );
}

const inp = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function InterviewEditCard({
  interview,
  onCancel,
  onSaved,
}: {
  interview: Interview;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [company, setCompany] = useState(interview.company);
  const [role, setRole] = useState(interview.role ?? "");
  const [round, setRound] = useState(interview.round ?? "Round 1");
  const [date, setDate] = useState(interview.interview_date);
  const [outcome, setOutcome] = useState(interview.outcome);
  const [questions, setQuestions] = useState(interview.questions ?? "");
  const [mistakes, setMistakes] = useState(interview.mistakes ?? "");
  const [learnings, setLearnings] = useState(interview.learnings ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setBusy(true);
    try {
      await updateInterview(interview.id, {
        company: company.trim(),
        role: role || null,
        round,
        interview_date: date,
        outcome,
        questions: questions || null,
        mistakes: mistakes || null,
        learnings: learnings || null,
      });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-2 rounded-xl border border-primary/40 bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input required placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className={inp} />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} className={inp} />
        <select value={round} onChange={(e) => setRound(e.target.value)} className={inp}>
          {ROUNDS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={inp}>
          {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <textarea placeholder="Questions asked" value={questions} onChange={(e) => setQuestions(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <textarea placeholder="Mistakes I made" value={mistakes} onChange={(e) => setMistakes(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <textarea placeholder="What I learned / will fix" value={learnings} onChange={(e) => setLearnings(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
          <X className="h-3 w-3" /> Cancel
        </button>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          <Check className="h-3 w-3" /> {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function InterviewForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [round, setRound] = useState("Round 1");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [outcome, setOutcome] = useState("Pending");
  const [questions, setQuestions] = useState("");
  const [mistakes, setMistakes] = useState("");
  const [learnings, setLearnings] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setBusy(true);
    try {
      await addInterview({
        company: company.trim(),
        role,
        round,
        interview_date: date,
        outcome,
        questions,
        mistakes,
        learnings,
      });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input required placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className={inp} />
        <input placeholder="Role (e.g., AI Engineer)" value={role} onChange={(e) => setRole(e.target.value)} className={inp} />
        <select value={round} onChange={(e) => setRound(e.target.value)} className={inp}>
          {ROUNDS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={inp}>
          {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <textarea placeholder="Questions asked" value={questions} onChange={(e) => setQuestions(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <textarea placeholder="Mistakes I made" value={mistakes} onChange={(e) => setMistakes(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <textarea placeholder="What I learned / will fix" value={learnings} onChange={(e) => setLearnings(e.target.value)} className={cn(inp, "w-full")} rows={2} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{busy ? "…" : "Save"}</button>
      </div>
    </form>
  );
}
