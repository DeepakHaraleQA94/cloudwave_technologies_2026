import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, CalendarDays, Users, Inbox, Star, FileText, HelpCircle, Image as ImageIcon, Video, CalendarHeart, Award, Palette, Settings as SettingsIcon, LogOut, Menu, X, Cloud, Mail, ShieldCheck, BadgeCheck, GraduationCap, CreditCard, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/site/SiteLayout";

const NAV = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/enquiries", label: "Enquiries", Icon: Inbox },
  { to: "/admin/r/courses", label: "Courses", Icon: BookOpen },
  { to: "/admin/r/batches", label: "Batches", Icon: CalendarDays },
  { to: "/admin/students", label: "Students", Icon: GraduationCap },
  { to: "/admin/r/trainers", label: "Trainers", Icon: Users },
  { to: "/admin/r/testimonials", label: "Testimonials", Icon: Star },
  { to: "/admin/r/blog", label: "Blog", Icon: FileText },
  { to: "/admin/r/faqs", label: "FAQs", Icon: HelpCircle },
  { to: "/admin/technologies", label: "Technologies", Icon: Cpu },
  { section: "Media" },
  { to: "/admin/r/gallery", label: "Photo Gallery", Icon: ImageIcon },
  { to: "/admin/r/videos", label: "Videos", Icon: Video },
  { to: "/admin/r/events", label: "Events", Icon: CalendarHeart },
  { to: "/admin/r/placements", label: "Placement Stories", Icon: Award },
  { to: "/admin/r/slides", label: "Homepage Slider", Icon: ImageIcon },
  { to: "/admin/r/certificates", label: "Certificates", Icon: BadgeCheck },
  { section: "System" },
  { to: "/admin/payments", label: "Payments", Icon: CreditCard },
  { to: "/admin/r/expenses", label: "Batch Expenses", Icon: CreditCard },
  { to: "/admin/messages", label: "Contact Messages", Icon: Mail },
  { to: "/admin/r/themes", label: "Theme Management", Icon: Palette },
  { to: "/admin/settings", label: "Website Settings", Icon: SettingsIcon },
  { to: "/admin/users", label: "Users / Admins", Icon: ShieldCheck },
];

export function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const doLogout = () => { logout(); nav("/admin/login"); };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Cloud className="h-5 w-5" /></span>
        <span className="font-heading font-bold">CloudWave <span className="text-xs font-normal text-muted-foreground">Admin</span></span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((n, i) => n.section ? (
          <p key={i} className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{n.section}</p>
        ) : (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            data-testid={`admin-nav-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
            <n.Icon className="h-4 w-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <p className="px-3 text-xs text-muted-foreground">Signed in as</p>
        <p className="px-3 text-sm font-medium truncate">{user?.email}</p>
        <Button variant="outline" className="mt-2 w-full justify-start" onClick={doLogout} data-testid="admin-logout-btn"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">{Sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{Sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <button onClick={() => setOpen(true)} data-testid="admin-menu-toggle"><Menu className="h-6 w-6" /></button>
          <span className="font-heading font-bold">CloudWave Admin</span>
          <button onClick={doLogout}><LogOut className="h-5 w-5" /></button>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
