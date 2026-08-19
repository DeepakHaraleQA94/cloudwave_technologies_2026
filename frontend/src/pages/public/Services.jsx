import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Smartphone, MonitorSmartphone, Cpu, CheckCircle2, ArrowRight, Layers, Rocket, ShieldCheck, Gauge, Workflow, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeading } from "@/components/site/SiteLayout";
import { useSite } from "@/context/SiteContext";
import SEO from "@/components/site/SEO";

const SERVICE_IMG = "https://images.pexels.com/photos/8453814/pexels-photo-8453814.jpeg?auto=compress&cs=tinysrgb&w=1000";
const fade = { hidden: { opacity: 0, y: 24 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

const SERVICES = [
  {
    Icon: Code2, title: "Website Development",
    tagline: "Any Domain • Any Scale",
    desc: "We design and build fast, secure and responsive websites and web applications for any industry — from marketing sites and portals to complex, data-driven platforms.",
    points: ["Custom business & e-commerce websites", "Progressive web apps (PWA) & dashboards", "REST/GraphQL APIs & third-party integrations", "SEO-ready, responsive & accessible builds"],
    stack: ["React", "Node.js", "Python", "FastAPI", "MongoDB", "PostgreSQL"],
  },
  {
    Icon: Smartphone, title: "Android Application Development",
    tagline: "Native & Cross-Platform",
    desc: "End-to-end Android apps engineered for performance and reach — from concept and UI/UX to Play Store launch and ongoing support.",
    points: ["Native Kotlin/Java & cross-platform apps", "Material Design UI/UX", "Offline sync, push notifications, payments", "Play Store deployment & maintenance"],
    stack: ["Kotlin", "Java", "Flutter", "React Native", "Firebase"],
  },
  {
    Icon: MonitorSmartphone, title: "iOS Application Development",
    tagline: "iPhone & iPad",
    desc: "Polished, App Store-ready iOS applications built to Apple's guidelines with smooth performance and elegant, intuitive interfaces.",
    points: ["Native Swift/SwiftUI development", "Human Interface Guideline compliant UX", "In-app purchases & Apple ecosystem APIs", "App Store submission & compliance"],
    stack: ["Swift", "SwiftUI", "Objective-C", "Flutter", "Firebase"],
  },
  {
    Icon: Cpu, title: "Windows Application Development",
    tagline: "Robust Desktop Software",
    desc: "Reliable, high-performance Windows desktop applications for business automation, data processing and enterprise workflows.",
    points: ["Desktop apps with modern UI (WPF/.NET)", "Business automation & reporting tools", "Database & hardware integrations", "Installers, updates & long-term support"],
    stack: [".NET", "C#", "WPF", "Electron", "SQL Server"],
  },
];

const PROCESS = [
  { Icon: Layers, t: "Discovery & Planning", d: "We understand your goals, scope the requirements and define a clear roadmap." },
  { Icon: Workflow, t: "Design & Prototype", d: "Wireframes and UI/UX prototypes so you see the product before we build it." },
  { Icon: Boxes, t: "Development & Testing", d: "Agile development sprints with continuous testing and quality checks." },
  { Icon: Rocket, t: "Launch & Support", d: "Smooth deployment plus ongoing maintenance, updates and support." },
];

export default function Services() {
  const { settings } = useSite();
  return (
    <div>
      <SEO title="Services — Application Development | CloudWave Technologies" description="CloudWave Technologies builds websites, Android, iOS and Windows applications for any domain — from design and development to deployment and support." />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-accent/20 blur-[120px]" />
        <Section className="relative grid items-center gap-10 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-accent" /> Software Development Services
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tighter sm:text-5xl">Application Development for Every Platform</h1>
            <p className="mt-5 max-w-xl text-slate-300 sm:text-lg">{settings.institute_name || "CloudWave Technologies"} builds robust, scalable software — websites, Android, iOS and Windows applications for any domain, from idea to launch and beyond.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full"><Link to="/enquiry">Request a Quote <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"><Link to="/contact">Talk to Us</Link></Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src={SERVICE_IMG} alt="Software development services at CloudWave Technologies" className="w-full object-cover" />
          </div>
        </Section>
      </section>

      {/* SERVICE MODULES */}
      <Section className="py-20">
        <SectionHeading center eyebrow="What We Build" title="Our Development Services"
          subtitle="Full-cycle application development delivered by experienced engineers using modern, production-grade technology." />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {SERVICES.map((s, i) => (
            <motion.div key={s.title} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg" data-testid={`service-${i}`}>
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><s.Icon className="h-7 w-7" /></span>
                <div>
                  <h3 className="font-heading text-xl font-bold">{s.title}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">{s.tagline}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 grid gap-2.5">
                {s.points.map((p) => <li key={p} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p}</li>)}
              </ul>
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-4">
                {s.stack.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* PROCESS */}
      <div className="bg-secondary/40 py-20">
        <Section>
          <SectionHeading center eyebrow="How We Work" title="Our Development Process" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <div key={p.t} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="absolute right-4 top-4 font-heading text-3xl font-bold text-primary/10">{String(i + 1).padStart(2, "0")}</span>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><p.Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{p.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* WHY US */}
      <Section className="py-20">
        <div className="grid gap-10 lg:grid-cols-3">
          {[
            { Icon: Gauge, t: "Performance First", d: "Optimised, scalable architecture that stays fast as you grow." },
            { Icon: ShieldCheck, t: "Secure & Reliable", d: "Security best practices and thorough testing baked into every build." },
            { Icon: Workflow, t: "Transparent Delivery", d: "Agile sprints, clear milestones and regular demos — no surprises." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><f.Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 font-heading text-lg font-bold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-10 text-center text-white sm:p-16">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Have a Project in Mind?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">Tell us about your idea and we'll help you turn it into a polished, production-ready application.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full"><Link to="/enquiry">Request a Quote</Link></Button>
              <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90"><Link to="/contact">Contact Us</Link></Button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
