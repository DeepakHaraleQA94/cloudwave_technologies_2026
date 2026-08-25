import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ThemeBanner from "./ThemeBanner";
import ThemeDecorations from "./ThemeDecorations";
import AIChat from "./AIChat";

export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ThemeBanner />
      <ThemeDecorations />
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppButton />
      <AIChat />
    </div>
  );
}

export function Section({ children, className = "", ...rest }) {
  return <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`} {...rest}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, subtitle, center, className = "" }) {
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
      <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" data-testid="loader">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function Empty({ title = "Nothing here yet", subtitle }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center" data-testid="empty-state">
      <p className="font-heading text-lg font-semibold">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
