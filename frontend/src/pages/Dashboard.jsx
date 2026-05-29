import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FolderKanban, PackageCheck, Users } from "lucide-react";
import { api, unwrap } from "../lib/api";
import { Badge, PageHeader, SkeletonRows } from "../components/ui";

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get("/dashboard").then(unwrap) });
  const stats = [
    { label: "Total Members", value: data?.stats.members, icon: Users },
    { label: "Upcoming Events", value: data?.stats.upcomingEvents, icon: CalendarDays },
    { label: "Items Borrowed", value: data?.stats.borrowed, icon: PackageCheck },
    { label: "Active Projects", value: data?.stats.activeProjects, icon: FolderKanban }
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard">A live command center for members, events, inventory, projects, and club communications.</PageHeader>
      {isLoading ? <SkeletonRows rows={4} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => <div key={stat.label} className="rounded-md border border-slate-800 bg-slate-900 p-5"><stat.icon className="h-5 w-5 text-sky-300" /><div className="mt-4 text-3xl font-bold text-white">{stat.value}</div><div className="mt-1 text-sm text-slate-400">{stat.label}</div></div>)}
          </div>
          <section className="rounded-md border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-4 font-semibold text-white">Recent Activity</div>
            <div className="divide-y divide-slate-800">
              {data?.activity.map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 p-4"><div><Badge tone="blue">{item.type}</Badge><p className="mt-2 text-sm text-slate-200">{item.text}</p></div><span className="text-xs text-slate-500">{new Date(item.at).toLocaleString()}</span></div>)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
