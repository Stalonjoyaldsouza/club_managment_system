import { NavLink, Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BarChart3, CalendarDays, FolderKanban, Home, LogOut, Mail, Package, Users } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance";
import Inventory from "./pages/Inventory";
import Projects from "./pages/Projects";
import Events from "./pages/Events";
import EmailStudio from "./pages/EmailStudio";
import Login from "./pages/Login";

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/members", label: "Members", icon: Users },
  { to: "/attendance", label: "Attendance", icon: BarChart3 },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/email", label: "Email Studio", icon: Mail }
];

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
    </Router>
  );
}

function Shell() {
  const { isAuthed, user, logout } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-800 bg-slate-950 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-800 p-5">
            <div className="text-xl font-bold text-white">ClubNexus</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-sky-300">Club Management System</div>
          </div>
          <nav className="grid gap-1 p-3">
            {navItems.map((item) => <NavItem key={item.to} {...item} />)}
          </nav>
          <div className="mt-auto border-t border-slate-800 p-4">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
            <button className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
      </aside>
      <main className="lg:pl-64">
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-ink/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-bold">ClubNexus</span>
            <button onClick={logout}><LogOut className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {navItems.map((item) => <NavItem compact key={item.to} {...item} />)}
          </div>
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/events" element={<Events />} />
            <Route path="/email" element={<EmailStudio />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, compact }) {
  return (
    <NavLink to={to} end={to === "/"} className={({ isActive }) => `inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"} ${compact ? "shrink-0" : ""}`}>
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
