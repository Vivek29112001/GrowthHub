import { supabase } from "@/integrations/supabase/client";

export type Milestone = {
  id: number;
  order_index: number;
  title: string;
  outcome: string | null;
  status: string;
  user_id: string;
};

export type Topic = {
  id: string;
  milestone_id: number;
  order_index: number;
  group_label: string | null;
  title: string;
  done: boolean;
  in_progress: boolean;
  notes: string | null;
  user_id: string;
};

export async function fetchRoadmap() {
  const [{ data: milestones, error: mErr }, { data: topics, error: tErr }] = await Promise.all([
    supabase.from("milestones").select("*").order("order_index"),
    supabase.from("topics").select("*").order("milestone_id").order("order_index"),
  ]);
  if (mErr) throw mErr;
  if (tErr) throw tErr;
  return { milestones: (milestones ?? []) as Milestone[], topics: (topics ?? []) as Topic[] };
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function createMilestone(input: { title: string; outcome?: string; order_index: number }) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("milestones")
    .insert({ title: input.title, outcome: input.outcome ?? null, order_index: input.order_index, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Milestone;
}

export async function updateMilestone(id: number, patch: Partial<Pick<Milestone, "title" | "outcome" | "status" | "order_index">>) {
  const { error } = await supabase.from("milestones").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMilestone(id: number) {
  const { error: tErr } = await supabase.from("topics").delete().eq("milestone_id", id);
  if (tErr) throw tErr;
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
}

export async function createTopic(input: { milestone_id: number; title: string; group_label?: string; order_index: number }) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("topics")
    .insert({
      milestone_id: input.milestone_id,
      title: input.title,
      group_label: input.group_label ?? null,
      order_index: input.order_index,
      user_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Topic;
}

export async function updateTopic(id: string, patch: Partial<Pick<Topic, "done" | "in_progress" | "notes" | "title" | "group_label">>) {
  const { error } = await supabase.from("topics").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTopic(id: string) {
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) throw error;
}
