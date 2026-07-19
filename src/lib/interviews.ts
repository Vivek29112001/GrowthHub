import { supabase } from "@/integrations/supabase/client";

export type Interview = {
  id: string;
  user_id: string;
  company: string;
  role: string | null;
  round: string | null;
  interview_date: string;
  outcome: string;
  questions: string | null;
  mistakes: string | null;
  learnings: string | null;
  created_at: string;
};

export async function listInterviews() {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .order("interview_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Interview[];
}

export async function addInterview(input: {
  company: string;
  role?: string;
  round?: string;
  interview_date?: string;
  outcome?: string;
  questions?: string;
  mistakes?: string;
  learnings?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("interviews").insert({
    company: input.company,
    role: input.role || null,
    round: input.round || null,
    interview_date: input.interview_date || new Date().toISOString().slice(0, 10),
    outcome: input.outcome || "Pending",
    questions: input.questions || null,
    mistakes: input.mistakes || null,
    learnings: input.learnings || null,
    user_id: u.user.id,
  });
  if (error) throw error;
}

export async function updateInterview(id: string, patch: Partial<Omit<Interview, "id" | "user_id" | "created_at">>) {
  const { error } = await supabase.from("interviews").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteInterview(id: string) {
  const { error } = await supabase.from("interviews").delete().eq("id", id);
  if (error) throw error;
}
