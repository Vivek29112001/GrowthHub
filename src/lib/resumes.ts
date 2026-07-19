import { supabase } from "@/integrations/supabase/client";

export type Resume = {
  user_id: string;
  content: string;
  ai_suggestions: unknown | null;
  updated_at: string;
};

export async function getResume(): Promise<Resume | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("resumes").select("*").eq("user_id", u.user.id).maybeSingle();
  if (error) throw error;
  return (data as Resume) ?? null;
}

export async function saveResume(content: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("resumes")
    .upsert({ user_id: u.user.id, content, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function saveResumeSuggestions(ai_suggestions: unknown) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("resumes")
    .update({ ai_suggestions: ai_suggestions as any, updated_at: new Date().toISOString() })
    .eq("user_id", u.user.id);
  if (error) throw error;
}
