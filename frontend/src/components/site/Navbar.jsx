import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Cloud, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSite } from "@/context/SiteContext";
import { mediaUrl } from "@/lib/api";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/batches", label: "Batches" },
  { to: "/placements", label: "Placements" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function Logo({ light }) {
  const { settings } = useSite();
  if (settings.logo_url) {
    return (
      <Link to="/" className="flex items-center" data-testid="site-logo">
        <img src={mediaUrl(settings.logo_url)} alt={settings.institute_name || "CloudWave Technologies"} className="h-9 w-auto object-contain" />
      </Link>
    );
  }
  return (
    <Link to="/" className="flex items-center gap-2.5 group" data-testid="site-logo">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Cloud className="h-5 w-5" />
      </span>
      <span className={`font-heading text-lg font-bold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
        {settings.institute_name || "CloudWave"}
        <span className="text-brand-accent">.</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { settings } = useSite();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {settings.phone && (
            <a href={`tel:${settings.phone}`} data-testid="nav-call-btn"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <Phone className="h-4 w-4" /> {settings.phone}
            </a>
          )}
          <Button onClick={() => nav("/enquiry")} data-testid="nav-enquire-btn" className="rounded-full">
            Enquire Now <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden" data-testid="mobile-menu">
          <nav className="flex flex-col p-4">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-md px-3 py-3 text-base font-medium ${isActive ? "bg-secondary text-primary" : "text-foreground"}`}>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 flex gap-2">
              <Button onClick={() => { setOpen(false); nav("/enquiry"); }} className="flex-1 rounded-full">Enquire Now</Button>
              {settings.phone && (
                <Button asChild variant="outline" className="rounded-full">
                  <a href={`tel:${settings.phone}`}><Phone className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
