import React from "react";
import { Target, Eye, Heart, Building2, GraduationCap, Briefcase, CheckCircle2 } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/SiteLayout";
import { useSite } from "@/context/SiteContext";
import SEO from "@/components/site/SEO";

const ABOUT_IMG = "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=srgb&fm=jpg&w=1000&q=80";
const INFRA_IMG = "https://images.pexels.com/photos/8453814/pexels-photo-8453814.jpeg?auto=compress&cs=tinysrgb&w=1000";

export default function About() {
  const { settings } = useSite();
  return (
    <div>
      <SEO title="About Us — CloudWave Technologies" description="Learn about CloudWave Technologies — our mission, vision, values and placement-focused training methodology." />
      <div className="border-b border-border bg-secondary/40">
        <Section className="py-14">
          <SectionHeading eyebrow="About Us" title="Building Tomorrow's Technology Professionals" subtitle={settings.footer_text} />
        </Section>
      </div>

      <Section className="grid items-center gap-12 py-16 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg"><img src={ABOUT_IMG} alt="Students collaborating at CloudWave" className="w-full object-cover" /></div>
        <div>
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Who We Are</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{settings.institute_name} is a premier IT training institute delivering hands-on, placement-focused programs across software development, cloud, testing, and data analytics. With {settings.stat_experience}+ years of experience, we have trained {settings.stat_students}+ students and helped them launch rewarding careers.</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">We specialise in end-to-end software development training — web, Android, iOS and Windows applications for any domain — taught by working industry experts who bring real-world context into every class.</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[["Students Trained", settings.stat_students + "+"], ["Placement Rate", settings.stat_placement + "%"], ["Expert Trainers", settings.stat_trainers + "+"], ["Courses", settings.stat_courses + "+"]].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-border bg-card p-4"><p className="font-heading text-2xl font-bold text-primary">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </div>
      </Section>

      <div className="bg-secondary/40 py-16">
        <Section>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: "Our Mission", d: "To empower learners with practical, industry-relevant skills that translate directly into successful IT careers.", Icon: Target },
              { t: "Our Vision", d: "To be the most trusted IT training institute, known for outcomes, integrity and student success.", Icon: Eye },
              { t: "Our Values", d: "Excellence, transparency, mentorship and an unwavering commitment to every student's growth.", Icon: Heart },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><x.Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 font-heading text-xl font-bold">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section className="grid items-center gap-12 py-16 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="How We Teach" title="Training Methodology & Environment" />
          <ul className="mt-6 space-y-3">
            {["Live instructor-led classes with recordings for revision","Real-time projects and hands-on labs","Small batches for personalised attention","Modern infrastructure and learning environment","Dedicated placement cell and career support","Interview preparation and resume building"].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg"><img src={INFRA_IMG} alt="Modern training infrastructure" className="w-full object-cover" /></div>
      </Section>

      <div className="bg-slate-950 py-16 text-white">
        <Section>
          <SectionHeading center title="Our Achievements" className="[&_h2]:text-white" />
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[[GraduationCap, settings.stat_students + "+", "Careers Launched"], [Briefcase, settings.stat_placement + "%", "Placement Assistance"], [Building2, "50+", "Hiring Partners"], [CheckCircle2, settings.stat_experience + "+", "Years of Trust"]].map(([Icon, v, l], i) => (
              <div key={i} className="text-center"><Icon className="mx-auto h-8 w-8 text-brand-accent" /><p className="mt-3 font-heading text-3xl font-bold">{v}</p><p className="text-sm text-slate-400">{l}</p></div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
