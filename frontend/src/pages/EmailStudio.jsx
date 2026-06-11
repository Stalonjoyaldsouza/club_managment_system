import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Send } from "lucide-react";
import { api, unwrap } from "../lib/api";
import { Badge, Button, Field, Input, PageHeader, Select, Textarea, SkeletonRows, statusTone } from "../components/ui";

export default function EmailStudio() {
  const queryClient = useQueryClient();
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => api.get("/members").then(unwrap) });
  const { data: settings } = useQuery({ queryKey: ["email-settings"], queryFn: () => api.get("/email/settings").then(unwrap) });
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["email-logs"], queryFn: () => api.get("/email/logs").then(unwrap) });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [external, setExternal] = useState("");
  const [form, setForm] = useState({ category: "ANNOUNCEMENT", subject: "", notes: "", tone: "Semi-formal", body: "", aiGenerated: false });
  const recipients = useMemo(() => {
    const memberEmails = selectedMembers
      .map((id) => members.find((m) => m.id === id)?.user.email)
      .filter(Boolean);
    const externalEmails = external
      .split(/[,\s;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set([...memberEmails, ...externalEmails])];
  }, [selectedMembers, external, members]);
  const generate = useMutation({
    mutationFn: () => api.post("/email/generate", { category: form.category, subject: form.subject, notes: form.notes, tone: form.tone }).then(unwrap),
    onSuccess: (data) => { setForm((current) => ({ ...current, body: data.body, aiGenerated: true })); toast.success("Email generated"); },
    onError: (error) => toast.error(error.response?.data?.message || "Could not generate email")
  });
  const send = useMutation({
    mutationFn: () => api.post("/email/send", { subject: form.subject, body: form.body, recipients, category: form.category, aiGenerated: form.aiGenerated }).then(unwrap),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      const accepted = data.providerResult?.accepted?.length ?? recipients.length;
      toast.success(`Email sent to ${accepted} recipient${accepted === 1 ? "" : "s"}`);
    },
    onError: (error) => {
      const details = error.response?.data?.errors?.fieldErrors;
      const firstError = details && Object.values(details).flat()[0];
      const providerError = error.response?.data?.providerResult?.response || error.response?.data?.providerResult?.error;
      toast.error(firstError || providerError || error.response?.data?.message || "Email failed");
    }
  });

  function setCategory(category) {
    const permissionNotes = `Club: ${settings?.clubName || "ClubNexus"}\nCollege: ${settings?.collegeName || "College"}\nEvent name:\nDate:\nVenue:\nExpected participants:`;
    setForm((current) => ({ ...current, category, notes: category === "PERMISSION" ? permissionNotes : current.notes, tone: category === "PERMISSION" ? "Formal" : current.tone }));
    if (category === "PERMISSION" && settings?.hodEmail) setExternal(settings.hodEmail);
  }

  return <div className="grid gap-6"><PageHeader title="Email Studio">Generate polished club emails with AI, edit the result, send through Gmail SMTP, and keep a delivery log.</PageHeader><section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><form className="grid gap-4 rounded-md border border-slate-800 bg-slate-900 p-5" onSubmit={(e) => e.preventDefault()}><div className="grid gap-4 md:grid-cols-3"><Field label="Category"><Select value={form.category} onChange={(e) => setCategory(e.target.value)}><option value="PERMISSION">Permission Request</option><option value="ANNOUNCEMENT">Announcement</option><option value="REMINDER">Reminder</option><option value="OTHER">Custom</option></Select></Field><Field label="Tone"><Select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}><option>Formal</option><option>Semi-formal</option><option>Friendly</option></Select></Field><Field label="Subject"><Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field></div><Field label="Members"><select multiple className="min-h-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" value={selectedMembers} onChange={(e) => setSelectedMembers(Array.from(e.target.selectedOptions, (option) => option.value))}>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name} — {m.user.email}</option>)}</select></Field><Field label="External emails"><Input value={external} onChange={(e) => setExternal(e.target.value)} placeholder="hod@college.edu, guest@example.com" /></Field><Field label="Key points / notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => generate.mutate()} disabled={generate.isPending}><Sparkles className="h-4 w-4" /> Generate with AI</Button><Button type="button" variant="ghost" onClick={() => send.mutate()} disabled={send.isPending || recipients.length === 0 || !form.body}><Send className="h-4 w-4" /> Send Email</Button></div><Field label="Editable email body"><Textarea className="min-h-72" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field><div className="flex flex-wrap gap-2 text-sm text-slate-400">{recipients.map((email) => <Badge key={email} tone="slate">{email}</Badge>)}</div></form><aside className="rounded-md border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 p-4 font-semibold text-white">Email Logs</div>{isLoading ? <div className="p-4"><SkeletonRows rows={4} /></div> : <div className="divide-y divide-slate-800">{logs.map((log) => <div className="p-4" key={log.id}><div className="flex items-center justify-between gap-3"><div className="font-medium text-white">{log.subject}</div><Badge tone={statusTone(log.status)}>{log.status}</Badge></div><div className="mt-2 text-xs text-slate-400">{log.recipients.join(", ")} • {new Date(log.sentAt).toLocaleString()}</div></div>)}</div>}</aside></section></div>;
}
