import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, bio, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}
