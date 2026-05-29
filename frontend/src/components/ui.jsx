import clsx from "clsx";
import { Search, X } from "lucide-react";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-sky-400 text-slate-950 hover:bg-sky-300",
    ghost: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
    danger: "bg-rose-500 text-white hover:bg-rose-400"
  };
  return <button className={clsx("inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />;
}

export function Field({ label, children }) {
  return <label className="grid gap-2 text-sm text-slate-300"><span>{label}</span>{children}</label>;
}

export function Input(props) {
  const { className, ...rest } = props;
  return <input className={clsx("min-h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 outline-none focus:border-sky-400", className)} {...rest} />;
}

export function Textarea(props) {
  const { className, ...rest } = props;
  return <textarea className={clsx("min-h-28 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400", className)} {...rest} />;
}

export function Select(props) {
  const { className, ...rest } = props;
  return <select className={clsx("min-h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-slate-100 outline-none focus:border-sky-400", className)} {...rest} />;
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-600 bg-slate-800 text-slate-200",
    green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    red: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    blue: "border-sky-500/40 bg-sky-500/10 text-sky-300"
  };
  return <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function PageHeader({ title, action, children }) {
  return <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-normal text-white">{title}</h1>{children && <p className="mt-1 max-w-2xl text-sm text-slate-400">{children}</p>}</div>{action}</div>;
}

export function SearchBox({ value, onChange, placeholder = "Search" }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-500" /><Input className="pl-10" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}

export function SkeletonRows({ rows = 5 }) {
  return <div className="grid gap-3">{Array.from({ length: rows }).map((_, index) => <div className="h-14 animate-pulse rounded-md bg-slate-800" key={index} />)}</div>;
}

export function EmptyState({ title, children }) {
  return <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-sm text-slate-400">{children}</p></div>;
}

export function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{title}</h2><button className="rounded-md p-2 hover:bg-slate-800" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

export function statusTone(status) {
  if (["ACTIVE", "ONGOING", "APPROVED", "PRESENT", "SENT", "RETURNED"].includes(status)) return "green";
  if (["UPCOMING", "PLANNING", "PENDING", "LATE", "DRAFT"].includes(status)) return "amber";
  if (["CANCELLED", "REJECTED", "ABSENT", "FAILED"].includes(status)) return "red";
  return "blue";
}
