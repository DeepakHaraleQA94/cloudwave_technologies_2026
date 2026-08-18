import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function ThemeBanner() {
  const { theme } = useSite();
  const [closed, setClosed] = useState(() => sessionStorage.getItem("cw_banner_closed") === "1");
  if (!theme || !theme.announcement_text || closed) return null;

  return (
    <div data-testid="theme-banner"
      className="relative z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-medium text-white"
      style={{ background: `linear-gradient(90deg, ${theme.primary_color || "#1D4ED8"}, ${theme.secondary_color || "#4F46E5"})` }}>
      <Sparkles className="hidden h-4 w-4 shrink-0 sm:block" />
      <span>{theme.announcement_text}</span>
      {theme.cta_text && theme.cta_url && (
        <Link to={theme.cta_url} data-testid="theme-banner-cta"
          className="hidden rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 sm:inline-block">
          {theme.cta_text}
        </Link>
      )}
      <button onClick={() => { setClosed(true); sessionStorage.setItem("cw_banner_closed", "1"); }}
        data-testid="theme-banner-close" aria-label="Dismiss" className="absolute right-3 opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
