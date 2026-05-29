import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api, unwrap } from "../lib/api";
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, SearchBox, Select, SkeletonRows, statusTone } from "../components/ui";

export default function Members() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => api.get("/members").then(unwrap) });
  const members = useMemo(() => data.filter((m) => `${m.user.name} ${m.user.email} ${m.department}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const create = useMutation({
    mutationFn: (payload) => api.post("/members", payload).then(unwrap),
    onSuccess: () => { toast.success("Member added"); setOpen(false); queryClient.invalidateQueries({ queryKey: ["members"] }); },
    onError: (error) => toast.error(error.response?.data?.message || "Could not add member")
  });

  return (
    <div className="grid gap-6">
      <PageHeader title="Members" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Member</Button>}>Search, filter, and review member profiles with projects, borrowed assets, and attendance rates.</PageHeader>
      <SearchBox value={q} onChange={setQ} placeholder="Search members" />
      {isLoading ? <SkeletonRows /> : members.length === 0 ? <EmptyState title="No members found">Add a member or adjust the search query.</EmptyState> : (
        <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400"><tr><th className="p-4">Member</th><th>Department</th><th>Role</th><th>Projects</th><th>Borrowed</th><th>Attendance</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {members.map((m) => <tr key={m.id}><td className="p-4"><div className="font-medium text-white">{m.user.name}</div><div className="text-xs text-slate-400">{m.user.email}</div></td><td>{m.department}<div className="text-xs text-slate-500">{m.position}</div></td><td><Badge tone={statusTone(m.user.role)}>{m.user.role}</Badge></td><td>{m.projectMemberships.length}</td><td>{m.borrowedRequests.length}</td><td>{m.attendanceRate}%</td><td><Badge tone={m.isActive ? "green" : "red"}>{m.isActive ? "Active" : "Inactive"}</Badge></td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {open && <MemberModal onClose={() => setOpen(false)} onSubmit={(payload) => create.mutate(payload)} isPending={create.isPending} />}
    </div>
  );
}

function MemberModal({ onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({ name: "", email: "", password: "clubnexus123", role: "MEMBER", department: "", position: "" });
  return <Modal title="Add member" onClose={onClose}><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Department"><Input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field><Field label="Position"><Input required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field><Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>ADMIN</option><option>MEMBER</option><option>VIEWER</option></Select></Field><Field label="Initial password"><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={isPending}>Save</Button></div></form></Modal>;
}
