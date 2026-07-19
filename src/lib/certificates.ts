import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  user_id: string;
  title: string;
  issuer: string | null;
  issue_date: string | null;
  url: string | null;
  notes: string | null;
  created_at: string;
};

export async function listCertificates() {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("issue_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Certificate[];
}

export async function addCertificate(input: {
  title: string;
  issuer?: string;
  issue_date?: string;
  url?: string;
  notes?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const { error } = await supabase.from("certificates").insert({
    title: input.title,
    issuer: input.issuer || null,
    issue_date: input.issue_date || null,
    url: input.url || null,
    notes: input.notes || null,
    user_id: u.user.id,
  });
  if (error) throw error;
}

export async function deleteCertificate(id: string) {
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) throw error;
}
