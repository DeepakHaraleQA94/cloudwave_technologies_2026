import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const SiteCtx = createContext(null);
export const useSite = () => useContext(SiteCtx);

function timeThemeVars() {
  const h = new Date().getHours();
  if (h >= 18 || h < 6) return { mode: "dark" };
  return { mode: "light" };
}

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [theme, setTheme] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/settings"), api.get("/theme/active")])
      .then(([s, t]) => { setSettings(s.data || {}); setTheme(t.data?.theme || null); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Apply time-based dark mode + festival accent
  useEffect(() => {
    const root = document.documentElement;
    const mode = settings.theme_mode;
    let dark = false;
    if (mode === "dark") dark = true;
    else if (mode === "light") dark = false;
    else if (mode === "auto" || !mode) dark = timeThemeVars().mode === "dark";
    root.classList.toggle("dark", dark);

    if (theme && theme.accent_color) {
      const hex = theme.accent_color;
      root.style.setProperty("--brand-accent", hexToHsl(hex));
    } else {
      root.style.setProperty("--brand-accent", "24 95% 53%");
    }
    if (settings.institute_name) document.title = settings.institute_name + " — IT Training Institute";
  }, [settings, theme]);

  return (
    <SiteCtx.Provider value={{ settings, theme, setTheme, loaded, refresh: () => api.get("/settings").then(r => setSettings(r.data)) }}>
      {children}
    </SiteCtx.Provider>
  );
}

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  r = parseInt(hex.substr(0, 2), 16) / 255;
  g = parseInt(hex.substr(2, 2), 16) / 255;
  b = parseInt(hex.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
