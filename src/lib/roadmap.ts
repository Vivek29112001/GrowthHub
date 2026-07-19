import { supabase } from "@/integrations/supabase/client";

export type Milestone = {
  id: number;
  order_index: number;
  title: string;
  outcome: string | null;
  status: string;
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

export async function updateTopic(id: string, patch: Partial<Pick<Topic, "done" | "in_progress" | "notes">>) {
  const { error } = await supabase.from("topics").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateMilestoneStatus(id: number, status: string) {
  const { error } = await supabase.from("milestones").update({ status }).eq("id", id);
  if (error) throw error;
}
