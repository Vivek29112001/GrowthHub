import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Sparkles, FileText, Wand2, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { getResume, saveResume, saveResumeSuggestions } from "@/lib/resumes";
import { analyzeResumeAgainstRoadmap, applyResumeSuggestions } from "@/lib/ai.functions";

export const Route = createFileRoute("/resume")({
  head: () => ({ meta: [{ title: "Resume AI — Roadmap Tracker" }] }),
  component: () => (
    <AppLayout>
      <ResumePage />
    </AppLayout>
  ),
});

type Suggestions = {
  summary: string;
  strengths: string[];
  gaps: string[];
  new_milestones: Array<{ title: string; outcome: string; topics: string[] }>;
  new_topics_for_existing: Array<{ milestone_title: string; topics: string[] }>;
};

function ResumePage() {
  const qc = useQueryClient();
  const { data: resume } = useQuery({ queryKey: ["resume"], queryFn: getResume });
  const [text, setText] = useState("");
  const [goal, setGoal] = useState("Become a strong AI Engineer");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (resume?.content) setText(resume.content);
    if (resume?.ai_suggestions) setSuggestions(resume.ai_suggestions as Suggestions);
  }, [resume]);

  const analyzeFn = useServerFn(analyzeResumeAgainstRoadmap);
  const applyFn = useServerFn(applyResumeSuggestions);

  const analyze = useMutation({
    mutationFn: async () => {
      await saveResume(text);
      const s = (await analyzeFn({ data: { resume: text, goal } })) as Suggestions;
      await saveResumeSuggestions(s);
      return s;
    },
    onSuccess: (s) => {
      setSuggestions(s);
      setApplied(false);
      qc.invalidateQueries({ queryKey: ["resume"] });
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!suggestions) return { added: 0 };
      return (await applyFn({ data: { suggestions } })) as { added: number };
    },
    onSuccess: () => {
      setApplied(true);
      qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Sparkles className="h-6 w-6 text-primary" /> Resume AI
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste your resume. The AI reads it, compares against your current roadmap, and suggests new milestones & topics tailored to your gaps.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your goal</label>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <label className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Resume (paste plain text)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Paste your resume text here…"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {resume?.updated_at ? `Last saved ${new Date(resume.updated_at).toLocaleString()}` : "Not saved yet"}
          </div>
          <button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || text.trim().length < 20}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {analyze.isPending ? "Analyzing…" : "Analyze & suggest updates"}
          </button>
        </div>
        {analyze.error && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {(analyze.error as Error).message}
          </div>
        )}
      </div>

      {suggestions && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</div>
            <p className="mt-1 text-sm">{suggestions.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Strengths</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {suggestions.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-destructive">Gaps</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {suggestions.gaps?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {(suggestions.new_milestones?.length || 0) + (suggestions.new_topics_for_existing?.length || 0) > 0 && (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Suggested roadmap updates</div>
                <button
                  onClick={() => apply.mutate()}
                  disabled={apply.isPending || applied}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {applied ? <><Check className="h-3.5 w-3.5" /> Added</> : apply.isPending ? "Adding…" : "Add to my roadmap"}
                </button>
              </div>

              {suggestions.new_milestones?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New milestones</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {suggestions.new_milestones.map((m, i) => (
                      <li key={i} className="rounded-md border border-border bg-card p-3">
                        <div className="font-semibold">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.outcome}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {m.topics.map((t, j) => (
                            <span key={j} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{t}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestions.new_topics_for_existing?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New topics for existing milestones</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {suggestions.new_topics_for_existing.map((g, i) => (
                      <li key={i} className="rounded-md border border-border bg-card p-3">
                        <div className="font-semibold">{g.milestone_title}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {g.topics.map((t, j) => (
                            <span key={j} className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{t}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
