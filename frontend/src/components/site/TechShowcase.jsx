import React, { useState } from "react";
import { Section, SectionHeading } from "@/components/site/SiteLayout";
import { useGet } from "@/hooks/usePublic";

export const ANIM_STYLES = [
  "Static", "Fade", "Slow Blink", "Slide", "Zoom", "Rotate",
  "3D Flip", "Tilt", "Float", "Bounce", "Pulse", "Glow", "Shimmer", "Carousel",
];
export const HOVER_EFFECTS = [
  { value: "none", label: "None" },
  { value: "3d-tilt", label: "3D Tilt" },
  { value: "zoom", label: "Zoom" },
  { value: "lift", label: "Lift" },
  { value: "glow", label: "Glow" },
];
const MARQUEE_STYLES = ["Slide", "Carousel"];
const STYLE_CLASS = {
  "Fade": "tech-anim-fade", "Slow Blink": "tech-anim-blink", "Zoom": "tech-anim-zoom",
  "Rotate": "tech-anim-rotate", "3D Flip": "tech-anim-flip", "Tilt": "tech-anim-tilt",
  "Float": "tech-anim-float", "Bounce": "tech-anim-bounce", "Pulse": "tech-anim-pulse",
  "Glow": "tech-anim-glow", "Shimmer": "tech-anim-shimmer",
};

function speedToDuration(speed, marquee) {
  const s = Math.min(Math.max(Number(speed) || 5, 1), 10);
  return marquee ? `${(11 - s) * 3 + 6}s` : `${((11 - s) * 0.35 + 0.6).toFixed(2)}s`;
}

function TechIcon({ t }) {
  const [err, setErr] = useState(false);
  if (t.svg_icon) return <span className="tech-svg h-10 w-10" dangerouslySetInnerHTML={{ __html: t.svg_icon }} />;
  if (t.icon_url && !err) return <img src={t.icon_url} alt={t.name} onError={() => setErr(true)} className="h-10 w-10 object-contain" />;
  const initials = (t.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className="grid h-10 w-10 place-items-center rounded-lg font-heading text-sm font-bold text-white"
      style={{ background: `linear-gradient(135deg, ${t.color || "#2563EB"}, ${(t.color || "#4F46E5")}cc)` }}>{initials || "?"}</span>
  );
}

export function TechCard({ t, presentation, index = 0, forceStatic = false }) {
  const style = forceStatic ? "Static" : (presentation.tech_style || "Float");
  const cls = STYLE_CLASS[style] || "";
  const loop = presentation.tech_loop !== false;
  const hover = `tech-hover-${presentation.tech_hover || "3d-tilt"}`;
  const animStyle = cls ? {
    animationDuration: speedToDuration(presentation.tech_speed, false),
    animationDelay: `${(Number(presentation.tech_delay) || 0) * index}ms`,
    animationIterationCount: loop ? "infinite" : 1,
  } : {};
  return (
    <div className={`tech-card ${cls} ${hover}`} style={{ ...animStyle, "--tech-color": t.color || "#2563EB" }}
      data-testid={`tech-card-${t.id || index}`}>
      <TechIcon t={t} />
      <p className="mt-3 font-heading text-sm font-semibold text-foreground">{t.name}</p>
      {t.description ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p> : null}
    </div>
  );
}

export function TechRow({ technologies, presentation }) {
  const techs = technologies || [];
  if (!techs.length) return null;
  const style = presentation.tech_style || "Float";
  if (MARQUEE_STYLES.includes(style)) {
    const loop = presentation.tech_loop !== false;
    const doubled = [...techs, ...techs];
    return (
      <div className="tech-marquee" data-testid="tech-marquee">
        <div className="tech-marquee-track" style={{
          animationDuration: speedToDuration(presentation.tech_speed, true),
          animationDirection: presentation.tech_direction === "right" ? "reverse" : "normal",
          animationIterationCount: loop ? "infinite" : 1,
        }}>
          {doubled.map((t, i) => <TechCard key={i} t={t} presentation={presentation} forceStatic />)}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" data-testid="tech-grid">
      {techs.map((t, i) => <TechCard key={t.id || i} t={t} presentation={presentation} index={i} />)}
    </div>
  );
}

export default function TechShowcase() {
  const { data } = useGet("/technologies");
  const techs = data?.technologies || [];
  const presentation = data?.presentation || {};
  if (!techs.length) return null;
  return (
    <Section className="py-20" data-testid="technologies-section">
      <SectionHeading center eyebrow="Tools & Stacks" title="Technologies We Teach"
        subtitle="Hands-on training across the modern tools, frameworks and platforms the industry runs on." />
      <div className="mt-12">
        <TechRow technologies={techs} presentation={presentation} />
      </div>
    </Section>
  );
}
