import { useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Field, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isAuthed, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "admin@clubnexus.test", password: "clubnexus123", role: "MEMBER", department: "Core", position: "Member" });
  if (isAuthed) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      toast.success("Welcome to ClubNexus");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-white">ClubNexus</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in with seeded admin credentials after setup.</p>
        <div className="mt-6 grid gap-4">
          {mode === "register" && <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>}
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          {mode === "register" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
              <Field label="Position"><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
            </div>
          )}
          <Button>{mode === "login" ? "Sign in" : "Create account"}</Button>
          <button type="button" className="text-sm text-sky-300 hover:text-sky-200" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Create a new member account" : "Use an existing account"}
          </button>
        </div>
      </form>
    </main>
  );
}
