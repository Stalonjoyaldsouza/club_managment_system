import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api, unwrap } from "../lib/api";
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Textarea, SkeletonRows, statusTone } from "../components/ui";

export default function Projects() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => api.get("/projects").then(unwrap) });
  const create = useMutation({
    mutationFn: (payload) => api.post("/projects", payload).then(unwrap),
    onSuccess: async () => {
      toast.success("Project saved");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      const details = error.response?.data?.errors?.fieldErrors;
      const firstError = details && Object.values(details).flat()[0];
      toast.error(firstError || error.response?.data?.message || "Could not save project");
    }
  });
  return <div className="grid gap-6"><PageHeader title="Projects" action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Project</Button>}>Track project status, tags, GitHub links, team size, and progress.</PageHeader>{isLoading ? <SkeletonRows /> : <div className="grid gap-4 lg:grid-cols-2">{projects.map((p) => <article className="rounded-md border border-slate-800 bg-slate-900 p-5" key={p.id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-white">{p.name}</h3><p className="mt-2 text-sm text-slate-400">{p.description}</p></div><Badge tone={statusTone(p.status)}>{p.status}</Badge></div><div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400" style={{ width: `${p.progress}%` }} /></div><div className="mt-4 flex flex-wrap gap-2">{p.tags.map((tag) => <Badge key={tag} tone="blue">{tag}</Badge>)}</div><div className="mt-4 text-sm text-slate-400">{p.members.length} team members • Started {new Date(p.startDate).toLocaleDateString()}</div>{p.githubUrl && <a className="mt-3 inline-block text-sm text-sky-300" href={p.githubUrl} target="_blank">GitHub repository</a>}</article>)}</div>}{open && <ProjectModal onClose={() => setOpen(false)} onSubmit={(payload) => create.mutate(payload)} />}</div>;
}

function ProjectModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING", startDate: new Date().toISOString().slice(0, 10), endDate: "", githubUrl: "", tags: "" });
  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      githubUrl: form.githubUrl.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    });
  }

  return <Modal title="Add project" onClose={onClose}><form className="grid gap-4" onSubmit={submit}><Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Description"><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>PLANNING</option><option>ACTIVE</option><option>COMPLETED</option><option>ON_HOLD</option><option>CANCELLED</option></Select></Field><Field label="Start date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field><Field label="End date"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field></div><Field label="GitHub URL"><Input placeholder="https://github.com/org/repo" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} /></Field><Field label="Tags"><Input placeholder="react, ai, backend" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field><Button>Save project</Button></form></Modal>;
}
