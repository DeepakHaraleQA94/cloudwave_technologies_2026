import React, { useEffect, useState } from "react";
import { Inbox, BookOpen, CalendarDays, Award, TrendingUp, UserPlus, CheckCircle2, Phone } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import { Loader } from "@/components/site/SiteLayout";

const COLORS = ["#1D4ED8", "#F97316", "#4F46E5", "#0891B2", "#16A34A", "#DB2777"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { theme } = useSite();
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);
  if (!stats) return <Loader />;

  const cards = [
    { label: "Total Enquiries", value: stats.total_enquiries, Icon: Inbox, color: "text-blue-600 bg-blue-100" },
    { label: "New Enquiries", value: stats.new_enquiries, Icon: UserPlus, color: "text-orange-600 bg-orange-100" },
    { label: "Contacted", value: stats.contacted, Icon: Phone, color: "text-indigo-600 bg-indigo-100" },
    { label: "Converted", value: stats.converted, Icon: CheckCircle2, color: "text-green-600 bg-green-100" },
    { label: "Total Courses", value: stats.total_courses, Icon: BookOpen, color: "text-cyan-600 bg-cyan-100" },
    { label: "Active Batches", value: stats.active_batches, Icon: CalendarDays, color: "text-pink-600 bg-pink-100" },
    { label: "Trainers", value: stats.total_trainers, Icon: TrendingUp, color: "text-violet-600 bg-violet-100" },
    { label: "Placements", value: stats.total_placements, Icon: Award, color: "text-amber-600 bg-amber-100" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">{theme?.type === "festival" ? `🎉 ${theme.name} — Welcome, Admin!` : "Dashboard"}</h1>
        <p className="text-sm text-muted-foreground">Overview of your institute's performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} data-testid={`stat-card-${c.label.toLowerCase().replace(/\s+/g, "-")}`} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-lg ${c.color}`}><c.Icon className="h-5 w-5" /></span>
            <p className="mt-3 font-heading text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="font-heading font-semibold">Enquiries by Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.by_month} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold">Enquiry Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.by_status} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {stats.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold">Enquiries by Course</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.by_course} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" fontSize={10} interval={0} tickFormatter={(v) => v.slice(0, 8)} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading font-semibold">Recent Enquiries</h3>
          <div className="mt-3 divide-y divide-border">
            {stats.recent.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No enquiries yet</p> :
              stats.recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div><p className="text-sm font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.course_name || "—"} · {e.mobile}</p></div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{e.status}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
