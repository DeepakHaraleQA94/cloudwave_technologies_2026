import React, { useEffect, useState } from "react";
import { useSite } from "@/context/SiteContext";

// Subtle, lightweight, CSS-only seasonal/festival decorations.
// Respects prefers-reduced-motion (renders nothing when reduced motion is on).
export default function ThemeDecorations() {
  const { theme } = useSite();
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  if (!allowed || !theme || !theme.animation_enabled) return null;

  const name = (theme.name || "").toLowerCase();
  let variant = "sparkle";
  if (name.includes("diwali") || name.includes("deepavali")) variant = "diwali";
  else if (name.includes("christmas") || name.includes("winter")) variant = "snow";
  else if (name.includes("new year") || name.includes("anniversary")) variant = "sparkle";
  else if (theme.type === "festival") variant = "diwali";

  const accent = theme.accent_color || "#F59E0B";
  const count = 16;
  const items = Array.from({ length: count });

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true" data-testid="theme-decorations">
      {variant === "diwali" && (
        <>
          {items.map((_, i) => {
            const left = (i * 6.2 + (i % 3) * 4) % 100;
            const delay = (i % 8) * 0.9;
            const size = 5 + (i % 3) * 2;
            return (
              <span key={i} className="cw-diya-spark" style={{
                left: `${left}%`, animationDelay: `${delay}s`, width: size, height: size,
                background: `radial-gradient(circle, ${accent} 0%, rgba(245,158,11,0.15) 70%, transparent 100%)`,
              }} />
            );
          })}
          {/* Row of glowing diya flames along the bottom */}
          <div className="absolute inset-x-0 bottom-0 flex justify-around px-6 pb-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="cw-diya-flame" style={{ animationDelay: `${(i % 4) * 0.3}s`, background: `radial-gradient(circle, #FFF7ED 0%, ${accent} 45%, transparent 75%)` }} />
            ))}
          </div>
        </>
      )}
      {variant === "snow" && items.map((_, i) => {
        const left = (i * 6.5) % 100;
        const dur = 8 + (i % 5) * 2;
        return <span key={i} className="cw-snow" style={{ left: `${left}%`, animationDuration: `${dur}s`, animationDelay: `${(i % 6) * 0.7}s` }} />;
      })}
      {variant === "sparkle" && items.map((_, i) => {
        const left = (i * 6.3 + (i % 4) * 3) % 100;
        const top = (i * 7.7) % 90;
        return <span key={i} className="cw-sparkle" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(i % 7) * 0.5}s`, color: accent }} />;
      })}
    </div>
  );
}
