import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Award, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { listCertificates, addCertificate, deleteCertificate } from "@/lib/certificates";

export const Route = createFileRoute("/certificates")({
  head: () => ({ meta: [{ title: "Certificates — Roadmap Tracker" }] }),
  component: () => (
    <AppLayout>
      <CertificatesPage />
    </AppLayout>
  ),
});

function CertificatesPage() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["certificates"], queryFn: listCertificates });
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: deleteCertificate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every certification you earn on your journey.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add certificate
        </button>
      </div>

      {open && <CertificateForm onDone={() => setOpen(false)} />}

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No certificates yet. Add your first one.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((c) => (
            <div key={c.id} className="group rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{c.title}</h3>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.issuer && <>{c.issuer}</>}
                    {c.issuer && c.issue_date && <> · </>}
                    {c.issue_date}
                  </div>
                  {c.notes && <p className="mt-2 text-sm text-muted-foreground">{c.notes}</p>}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => confirm(`Delete "${c.title}"?`) && del.mutate(c.id)}
                  className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function CertificateForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issue_date, setDate] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addCertificate({ title: title.trim(), issuer, issue_date, url, notes });
      qc.invalidateQueries({ queryKey: ["certificates"] });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input required placeholder="Certificate title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input placeholder="Issuer (e.g., Coursera)" value={issuer} onChange={(e) => setIssuer(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input type="date" value={issue_date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input placeholder="URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" rows={2} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{busy ? "…" : "Save"}</button>
      </div>
    </form>
  );
}
