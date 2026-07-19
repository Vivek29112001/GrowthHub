import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type ResumeAnalysis = {
  summary: string;
  strengths: string[];
  gaps: string[];
  new_milestones: Array<{ title: string; outcome: string; topics: string[] }>;
  new_topics_for_existing: Array<{ milestone_title: string; topics: string[] }>;
};

/**
 * Analyzes the user's resume against their current roadmap and returns
 * suggested new milestones and topics. Does NOT auto-write — the client
 * decides what to apply.
 */
export const analyzeResumeAgainstRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { resume?: string; goal?: string };
    if (!i || typeof i.resume !== "string" || i.resume.trim().length < 20) {
      throw new Error("Resume text is required (at least 20 chars)");
    }
    return { resume: i.resume.trim(), goal: (i.goal ?? "").toString().trim() };
  })
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const [{ data: milestones }, { data: topics }] = await Promise.all([
      context.supabase.from("milestones").select("id, title, outcome, order_index").order("order_index"),
      context.supabase.from("topics").select("milestone_id, title, done"),
    ]);

    const roadmapSummary = (milestones ?? [])
      .map((m: any) => {
        const mTopics = (topics ?? []).filter((t: any) => t.milestone_id === m.id);
        const done = mTopics.filter((t: any) => t.done).length;
        return `- ${m.title} (${done}/${mTopics.length} done): ${m.outcome ?? ""}`;
      })
      .join("\n");

    const system = `You are an expert AI career coach. Given a user's resume and their current learning roadmap, identify skill gaps and suggest concrete additions to the roadmap.

You MUST respond with ONLY valid JSON matching this exact schema:
{
  "summary": "1-2 sentence assessment of the user's profile",
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "new_milestones": [
    { "title": "...", "outcome": "...", "topics": ["topic 1", "topic 2"] }
  ],
  "new_topics_for_existing": [
    { "milestone_title": "must match an existing milestone title exactly", "topics": ["topic 1"] }
  ]
}

Rules:
- Do NOT remove or duplicate existing milestones/topics.
- Suggest at most 3 new milestones and at most 5 new topics per existing milestone.
- Keep topic titles short and actionable.
- Return raw JSON only, no markdown fences, no commentary.`;

    const user = `USER GOAL: ${data.goal || "Become a strong AI Engineer"}

CURRENT ROADMAP:
${roadmapSummary || "(empty)"}

USER RESUME:
${data.resume.slice(0, 8000)}`;

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI is rate-limited. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please top up your Lovable workspace.");
      throw new Error(`AI request failed [${res.status}]: ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: ResumeAnalysis;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // strip possible fences
      const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }
    return parsed;
  });

/**
 * Applies AI suggestions to the user's roadmap (creates new milestones/topics).
 */
export const applyResumeSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { suggestions?: ResumeAnalysis };
    if (!i?.suggestions) throw new Error("Suggestions required");
    return i.suggestions;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: existing } = await context.supabase
      .from("milestones")
      .select("id, title, order_index")
      .order("order_index");

    let nextOrder = (existing?.length ?? 0) + 1;
    let added = 0;

    // Add new milestones
    for (const m of data.new_milestones ?? []) {
      if (!m.title) continue;
      const { data: ms, error } = await context.supabase
        .from("milestones")
        .insert({
          title: m.title,
          outcome: m.outcome || null,
          order_index: nextOrder++,
          user_id: userId,
        })
        .select("id")
        .single();
      if (error) continue;
      if (ms && m.topics?.length) {
        const rows = m.topics.map((t, i) => ({
          milestone_id: ms.id,
          user_id: userId,
          title: t,
          order_index: i + 1,
        }));
        await context.supabase.from("topics").insert(rows);
      }
      added++;
    }

    // Add topics to existing milestones by title match
    for (const item of data.new_topics_for_existing ?? []) {
      const target = existing?.find(
        (e: any) => e.title.trim().toLowerCase() === item.milestone_title.trim().toLowerCase(),
      );
      if (!target) continue;
      const { count } = await context.supabase
        .from("topics")
        .select("*", { count: "exact", head: true })
        .eq("milestone_id", target.id);
      const base = count ?? 0;
      const rows = item.topics.map((t, i) => ({
        milestone_id: target.id,
        user_id: userId,
        title: t,
        order_index: base + i + 1,
      }));
      if (rows.length) {
        await context.supabase.from("topics").insert(rows);
        added += rows.length;
      }
    }

    return { added };
  });
