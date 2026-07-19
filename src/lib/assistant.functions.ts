import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type ChatMsg = { role: "user" | "assistant"; content: string };

export const chatAboutProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { messages?: ChatMsg[] };
    if (!i || !Array.isArray(i.messages) || i.messages.length === 0) {
      throw new Error("messages required");
    }
    const messages = i.messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    return { messages };
  })
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const sb = context.supabase;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString().slice(0, 10);

    const [
      { data: milestones },
      { data: topics },
      { data: study },
      { data: certs },
      { data: interviews },
    ] = await Promise.all([
      sb.from("milestones").select("id, title, outcome, status, order_index").order("order_index"),
      sb.from("topics").select("id, milestone_id, title, done, status"),
      sb.from("study_sessions").select("date, minutes, topic").gte("date", sinceIso).order("date", { ascending: false }),
      sb.from("certificates").select("title, issuer, date_earned"),
      sb.from("interviews").select("company, role, round, date, outcome, mistakes, learnings"),
    ]);

    const mList = milestones ?? [];
    const tList = topics ?? [];
    const sList = study ?? [];
    const totalTopics = tList.length;
    const doneTopics = tList.filter((t: any) => t.done).length;
    const totalMinutes = sList.reduce((a: number, s: any) => a + (s.minutes ?? 0), 0);

    // streak calc
    const dates = new Set(sList.map((s: any) => s.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }

    const milestoneLines = mList
      .map((m: any) => {
        const mt = tList.filter((t: any) => t.milestone_id === m.id);
        const done = mt.filter((t: any) => t.done).length;
        return `- ${m.title} [${done}/${mt.length}] status=${m.status ?? "pending"}`;
      })
      .join("\n");

    const recentStudy = sList
      .slice(0, 10)
      .map((s: any) => `  * ${s.date}: ${s.minutes}m ${s.topic ? "- " + s.topic : ""}`)
      .join("\n");

    const certLines = (certs ?? []).map((c: any) => `  * ${c.title} (${c.issuer ?? "?"}) ${c.date_earned ?? ""}`).join("\n");
    const intLines = (interviews ?? [])
      .map(
        (i: any) =>
          `  * ${i.company} - ${i.role ?? ""} round:${i.round ?? "?"} outcome:${i.outcome ?? "?"}${
            i.mistakes ? " | mistakes: " + i.mistakes.slice(0, 200) : ""
          }`,
      )
      .join("\n");

    const overallPct = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

    const system = `You are a personal AI coach embedded in the user's "AI Engineer Roadmap Tracker". You answer ONLY based on the user's actual progress data below. Be concise, encouraging, specific, and actionable. If asked something unrelated to their learning/career progress, gently redirect. Use bullet points when helpful. Reply in the same language the user writes in (English or Hinglish).

===== USER PROGRESS SNAPSHOT =====
Overall: ${doneTopics}/${totalTopics} topics done (${overallPct}%)
Current study streak: ${streak} day(s)
Study minutes last 30 days: ${totalMinutes} (~${(totalMinutes / 60).toFixed(1)} hrs)

MILESTONES:
${milestoneLines || "(none)"}

RECENT STUDY SESSIONS:
${recentStudy || "(none logged in last 30 days)"}

CERTIFICATES:
${certLines || "(none)"}

INTERVIEWS:
${intLines || "(none)"}
===== END SNAPSHOT =====`;

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("AI is rate-limited. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please top up your Lovable workspace.");
      throw new Error(`AI request failed [${res.status}]: ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "(no reply)";
    return { reply };
  });
