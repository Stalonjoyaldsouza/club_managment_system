import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api, unwrap } from "../lib/api";
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, SearchBox, Select, Textarea, SkeletonRows, statusTone } from "../components/ui";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => api.get("/inventory").then(unwrap) });
  const { data: requests = [] } = useQuery({ queryKey: ["borrow-requests"], queryFn: () => api.get("/inventory/borrow-requests").then(unwrap) });
  const visible = useMemo(() => items.filter((i) => `${i.name} ${i.category}`.toLowerCase().includes(q.toLowerCase())), [items, q]);
  const createItem = useMutation({ mutationFn: (payload) => api.post("/inventory", payload).then(unwrap), onSuccess: () => done("Item saved"), onError: fail });
  const borrow = useMutation({ mutationFn: (payload) => api.post("/inventory/borrow", payload).then(unwrap), onSuccess: () => done("Borrow request submitted"), onError: fail });
  const approve = useMutation({ mutationFn: ({ id, approved }) => api.put(`/inventory/borrow/${id}/approve`, { approved }).then(unwrap), onSuccess: () => done("Request updated"), onError: fail });
  const ret = useMutation({ mutationFn: (id) => api.put(`/inventory/borrow/${id}/return`).then(unwrap), onSuccess: () => done("Item returned"), onError: fail });
  function done(message) { toast.success(message); setModal(null); queryClient.invalidateQueries(); }
  function fail(error) { toast.error(error.response?.data?.message || "Inventory action failed"); }

  return <div className="grid gap-6"><PageHeader title="Inventory" action={<Button onClick={() => setModal({ type: "item" })}><Plus className="h-4 w-4" /> Add Item</Button>}>Manage assets, requests, approvals, returns, and overdue borrowed items.</PageHeader><SearchBox value={q} onChange={setQ} placeholder="Search inventory" />{isLoading ? <SkeletonRows /> : visible.length === 0 ? <EmptyState title="No inventory items">Add equipment, supplies, or media assets.</EmptyState> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <div className="rounded-md border border-slate-800 bg-slate-900 p-4" key={item.id}>{item.imageUrl && <img className="mb-4 h-36 w-full rounded-md object-cover" src={item.imageUrl} alt="" />}<div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{item.name}</h3><p className="mt-1 text-sm text-slate-400">{item.description}</p></div><Badge tone={item.availableQuantity > 0 ? "green" : "red"}>{item.availableQuantity}/{item.totalQuantity}</Badge></div><div className="mt-4 flex items-center justify-between"><Badge tone="blue">{item.category}</Badge><Button variant="ghost" onClick={() => setModal({ type: "borrow", item })}>Borrow</Button></div></div>)}</div>}<section className="rounded-md border border-slate-800 bg-slate-900"><div className="border-b border-slate-800 p-4 font-semibold text-white">Borrow Requests</div><div className="divide-y divide-slate-800">{requests.map((r) => <div key={r.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="font-medium text-white">{r.item.name} x {r.quantity}</div><div className="text-sm text-slate-400">{r.borrower.user.name} • Due {new Date(r.dueDate).toLocaleDateString()} • {r.purpose}</div></div><div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(r.status)}>{r.status}</Badge>{r.status === "PENDING" && <><Button variant="ghost" onClick={() => approve.mutate({ id: r.id, approved: true })}>Approve</Button><Button variant="danger" onClick={() => approve.mutate({ id: r.id, approved: false })}>Reject</Button></>}{r.status === "APPROVED" && <Button variant="ghost" onClick={() => ret.mutate(r.id)}>Return</Button>}</div></div>)}</div></section>{modal?.type === "item" && <ItemModal onClose={() => setModal(null)} onSubmit={(payload) => createItem.mutate(payload)} />}{modal?.type === "borrow" && <BorrowModal item={modal.item} onClose={() => setModal(null)} onSubmit={(payload) => borrow.mutate(payload)} />}</div>;
}

function ItemModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", description: "", category: "", totalQuantity: 1, availableQuantity: 1, imageUrl: "" });
  return <Modal title="Add inventory item" onClose={onClose}><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}><Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Description"><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Category"><Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field><Field label="Total"><Input type="number" min="1" value={form.totalQuantity} onChange={(e) => setForm({ ...form, totalQuantity: Number(e.target.value) })} /></Field><Field label="Available"><Input type="number" min="0" value={form.availableQuantity} onChange={(e) => setForm({ ...form, availableQuantity: Number(e.target.value) })} /></Field></div><Field label="Image URL"><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field><Button>Save item</Button></form></Modal>;
}

function BorrowModal({ item, onClose, onSubmit }) {
  const [form, setForm] = useState({ itemId: item.id, quantity: 1, days: 7, purpose: "", notes: "" });
  return <Modal title={`Borrow ${item.name}`} onClose={onClose}><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Quantity"><Input type="number" min="1" max={item.availableQuantity} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></Field><Field label="Days"><Input type="number" min="1" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></Field></div><Field label="Purpose"><Textarea required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field><Button>Submit request</Button></form></Modal>;
}
