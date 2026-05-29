import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { api, unwrap } from "../lib/api";
import { Badge, Button, Field, PageHeader, Select, SkeletonRows, statusTone } from "../components/ui";

export default function Attendance() {
  const queryClient = useQueryClient();
  const { data: records = [], isLoading } = useQuery({ queryKey: ["attendance"], queryFn: () => api.get("/attendance").then(unwrap) });
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => api.get("/members").then(unwrap) });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => api.get("/events").then(unwrap) });
  const [form, setForm] = useState({ memberId: "", eventId: "", status: "PRESENT" });
  const mark = useMutation({
    mutationFn: () => api.post("/attendance/mark", { ...form, eventId: form.eventId || null, date: new Date().toISOString() }).then(unwrap),
    onSuccess: () => { toast.success("Attendance marked"); queryClient.invalidateQueries({ queryKey: ["attendance"] }); },
    onError: (error) => toast.error(error.response?.data?.message || "Could not mark attendance")
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Attendance" action={<Button as="a" onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/attendance/export.csv`, "_blank")}>Export CSV</Button>}>Mark event attendance and track member history, rates, and streaks.</PageHeader>
      <form className="grid gap-4 rounded-md border border-slate-800 bg-slate-900 p-4 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); mark.mutate(); }}>
        <Field label="Member"><Select required value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}><option value="">Select member</option>{members.map((m) => <option key={m.id} value={m.id}>{m.user.name}</option>)}</Select></Field>
        <Field label="Event"><Select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}><option value="">General</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</Select></Field>
        <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>PRESENT</option><option>LATE</option><option>ABSENT</option></Select></Field>
        <div className="flex items-end"><Button disabled={mark.isPending} className="w-full">Mark</Button></div>
      </form>
      {isLoading ? <SkeletonRows /> : <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-900"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-950 text-xs uppercase text-slate-400"><tr><th className="p-4">Member</th><th>Event</th><th>Date</th><th>Marked By</th><th>Status</th></tr></thead><tbody className="divide-y divide-slate-800">{records.map((r) => <tr key={r.id}><td className="p-4 font-medium text-white">{r.member.user.name}</td><td>{r.event?.name || "General"}</td><td>{new Date(r.date).toLocaleDateString()}</td><td>{r.markedBy.user.name}</td><td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td></tr>)}</tbody></table></div>}
    </div>
  );
}
