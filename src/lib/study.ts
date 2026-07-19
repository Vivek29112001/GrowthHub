import { supabase } from "@/integrations/supabase/client";

export type StudySession = {
  id: string;
  user_id: string;
  session_date: string; // YYYY-MM-DD
  minutes: number;
  topic: string | null;
  notes: string | null;
  created_at: string;
};

export async function listStudySessions(limit = 200) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as StudySession[];
}

export async function addStudySession(input: {
  minutes: number;
  session_date?: string;
  topic?: string;
  notes?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("study_sessions").insert({
    minutes: input.minutes,
    session_date: input.session_date || new Date().toISOString().slice(0, 10),
    topic: input.topic || null,
    notes: input.notes || null,
    user_id: u.user.id,
  });
  if (error) throw error;
}

export async function deleteStudySession(id: string) {
  const { error } = await supabase.from("study_sessions").delete().eq("id", id);
  if (error) throw error;
}

/** Compute current & best streaks from a chronological (desc) list. */
export function computeStreaks(sessions: StudySession[]) {
  if (sessions.length === 0) return { current: 0, best: 0, totalMinutes: 0, todayMinutes: 0 };
  const daysSet = new Set(sessions.map((s) => s.session_date));
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // current streak: count back from today (or yesterday if no session today)
  let current = 0;
  const cursor = new Date(today);
  if (!daysSet.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daysSet.has(iso(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best streak: scan sorted asc unique dates
  const days = Array.from(daysSet).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const dt = new Date(d + "T00:00:00Z");
    if (prev && (dt.getTime() - prev.getTime()) / 86400000 === 1) run++;
    else run = 1;
    if (run > best) best = run;
    prev = dt;
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const todayMinutes = sessions
    .filter((s) => s.session_date === iso(today))
    .reduce((sum, s) => sum + s.minutes, 0);

  return { current, best, totalMinutes, todayMinutes };
}

export function last30DaysBuckets(sessions: StudySession[]) {
  const map = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of sessions) {
    if (map.has(s.session_date)) map.set(s.session_date, (map.get(s.session_date) ?? 0) + s.minutes);
  }
  return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }));
}
