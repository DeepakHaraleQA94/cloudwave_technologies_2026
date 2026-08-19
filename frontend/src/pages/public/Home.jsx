import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Rocket, ShieldCheck, GraduationCap, Briefcase, Users2, Award, Star, Cpu, Cloud, Code2, Smartphone, MonitorSmartphone, CheckCircle2, PlayCircle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section, SectionHeading } from "@/components/site/SiteLayout";
import { CourseCard, TrainerCard, TestimonialCard, BlogCard, BatchRow } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import { useSite } from "@/context/SiteContext";
import { mediaUrl } from "@/lib/api";
import SEO from "@/components/site/SEO";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/87cb7d4d-e4eb-46d2-8fde-72914c1ff5ef/images/6e77eac6a581f3038f6e8f5d5f5a56f76d1c46d73a4bb09b2b3108b3e837620c.jpeg";

const fade = { hidden: { opacity: 0, y: 24 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

export default function Home() {
  const { settings } = useSite();
  const { data: courses } = useGet("/courses?featured=true");
  const { data: allCourses } = useGet("/courses");
  const { data: trainers } = useGet("/trainers");
  const { data: batches } = useGet("/batches");
  const { data: testimonials } = useGet("/testimonials");
  const { data: faqs } = useGet("/faqs");
  const { data: blog } = useGet("/blog");
  const { data: videos } = useGet("/videos");

  const featured = (courses?.length ? courses : allCourses)?.slice(0, 6) || [];
  const upcoming = (batches || []).filter((b) => ["Upcoming", "Filling Fast", "Started"].includes(b.status)).slice(0, 4);

  const stats = [
    { label: "Students Trained", value: settings.stat_students, suffix: "+", Icon: GraduationCap },
    { label: "Expert Courses", value: settings.stat_courses, suffix: "+", Icon: Code2 },
    { label: "Industry Trainers", value: settings.stat_trainers, suffix: "+", Icon: Users2 },
    { label: "Placement Rate", value: settings.stat_placement, suffix: "%", Icon: Briefcase },
    { label: "Years Experience", value: settings.stat_experience, suffix: "+", Icon: Award },
  ];

  return (
    <div>
      <SEO title={`${settings.institute_name || "CloudWave Technologies"} — IT Training Institute`} description={settings.hero_description} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-brand-accent/20 blur-[120px]" />
        {/* Rotating CloudWave brand emblem watermark */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
          <div className="cw-spin-slow grid h-[520px] w-[520px] place-items-center rounded-full border border-dashed border-white/10">
            <div className="cw-spin-rev grid h-[360px] w-[360px] place-items-center rounded-full border border-white/[0.06]">
              {settings.logo_url ? (
                <img src={mediaUrl(settings.logo_url)} alt="" className="h-40 w-40 rounded-full object-contain opacity-[0.07] invert" />
              ) : (
                <Cloud className="h-40 w-40 text-white/10" />
              )}
            </div>
          </div>
        </div>
        <Section className="relative z-10 grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <motion.div initial="hidden" animate="show" variants={fade}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200">
              <Rocket className="h-3.5 w-3.5 text-brand-accent" /> {settings.tagline || "Launch Your IT Career"}
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tighter sm:text-5xl lg:text-6xl">
              {settings.hero_title || "Launch Your IT Career with Industry-Ready Training"}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">{settings.hero_description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full" data-testid="hero-explore-btn">
                <Link to="/courses">Explore Courses <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="rounded-full" data-testid="hero-enquire-btn">
                <Link to="/enquiry">Enquire Now</Link>
              </Button>
              {settings.phone && (
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10" data-testid="hero-call-btn">
                  <a href={`tel:${settings.phone}`}><Phone className="mr-1 h-4 w-4" /> Call Now</a>
                </Button>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              {["Placement Assistance", "Live Expert-Led Classes", "Real Projects"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-accent" /> {t}</span>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
            <div className="animate-floaty overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img src={mediaUrl(settings.hero_image) || HERO_IMG} alt="IT training at CloudWave Technologies" className="w-full object-cover" />
            </div>
          </motion.div>
        </Section>
      </section>

      {/* STATS */}
      <Section className="-mt-10 relative z-10">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg md:grid-cols-5">
          {stats.map((s, i) => (
            <div key={s.label} data-testid={`stat-${i}`} className="text-center">
              <s.Icon className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{s.value}{s.suffix}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section className="py-20">
        <SectionHeading center eyebrow="What We Build & Teach" title="End-to-End Software Development Training"
          subtitle="From web to mobile to desktop — master the skills to build production software for any domain." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Web Development", d: "Full stack web apps for any domain.", Icon: Code2 },
            { t: "Android Apps", d: "Native & cross-platform Android development.", Icon: Smartphone },
            { t: "iOS Apps", d: "Build and ship polished iOS applications.", Icon: MonitorSmartphone },
            { t: "Windows Apps", d: "Robust desktop applications for Windows.", Icon: Cpu },
          ].map((s, i) => (
            <motion.div key={s.t} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><s.Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* POPULAR COURSES */}
      <div className="bg-secondary/40 py-20">
        <Section>
          <div className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Popular Programs" title="Explore Our Top Courses" />
            <Button asChild variant="outline" className="hidden rounded-full sm:flex"><Link to="/courses">View All Courses <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
        </Section>
      </div>

      {/* WHY CHOOSE US - bento */}
      <Section className="py-20">
        <SectionHeading center eyebrow="Why CloudWave" title="Why Students Choose Us" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-indigo-700 p-8 text-white md:row-span-2">
            <ShieldCheck className="h-8 w-8" />
            <h3 className="mt-4 font-heading text-xl font-bold">Placement-Focused Training</h3>
            <p className="mt-2 text-sm text-white/85">Dedicated placement cell, resume building, mock interviews and hiring-partner referrals to get you job-ready.</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div><p className="font-heading text-2xl font-bold">{settings.stat_placement}%</p><p className="text-xs text-white/70">Placement Rate</p></div>
              <div><p className="font-heading text-2xl font-bold">{settings.stat_students}+</p><p className="text-xs text-white/70">Trained</p></div>
            </div>
          </div>
          {[
            { t: "Industry Expert Trainers", d: "Learn from professionals with 8-13+ years of real experience.", Icon: Users2 },
            { t: "Real-Time Projects", d: "Build portfolio-ready projects that impress recruiters.", Icon: Briefcase },
            { t: "Flexible Batches", d: "Weekday, weekend and fast-track batches, online or classroom.", Icon: GraduationCap },
            { t: "Recognised Certification", d: "Earn certificates and prepare for global vendor exams.", Icon: Award },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><f.Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* UPCOMING BATCHES */}
      {upcoming.length > 0 && (
        <div className="bg-secondary/40 py-20">
          <Section>
            <SectionHeading center eyebrow="Enroll Now" title="Upcoming Batches" subtitle="Reserve your seat in our next batches before they fill up." />
            <div className="mx-auto mt-10 grid max-w-4xl gap-4">
              {upcoming.map((b) => <BatchRow key={b.id} b={b} />)}
            </div>
            <div className="mt-8 text-center"><Button asChild variant="outline" className="rounded-full"><Link to="/batches">View All Batches</Link></Button></div>
          </Section>
        </div>
      )}

      {/* PLACEMENTS */}

      {/* TESTIMONIALS */}
      {testimonials?.length > 0 && (
        <div className="bg-slate-950 py-20 text-white">
          <Section>
            <SectionHeading center eyebrow="Student Voices" title="What Our Students Say"
              className="[&_h2]:text-white [&_p]:text-slate-300" />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < (t.rating || 5) ? "fill-brand-accent text-brand-accent" : "text-white/20"}`} />)}</div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-200">“{t.text}”</p>
                  <p className="mt-5 font-heading text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.course}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TRAINERS */}
      {trainers?.length > 0 && (
        <Section className="py-20">
          <SectionHeading center eyebrow="Meet Your Mentors" title="Learn From Industry Experts" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trainers.slice(0, 4).map((t) => <TrainerCard key={t.id} t={t} />)}
          </div>
        </Section>
      )}

      {/* VIDEOS */}
      {videos?.length > 0 && (
        <div className="bg-secondary/40 py-20">
          <Section>
            <SectionHeading center eyebrow="Watch Our Videos" title="See What Happens at Our Institute" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {videos.slice(0, 3).map((v) => <VideoThumb key={v.id} v={v} />)}
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild variant="outline" className="rounded-full"><Link to="/videos"><PlayCircle className="mr-1 h-4 w-4" /> More Videos</Link></Button>
              {settings.instagram && <Button asChild variant="outline" className="rounded-full"><a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram className="mr-1 h-4 w-4" /> Follow on Instagram</a></Button>}
            </div>
          </Section>
        </div>
      )}

      {/* FAQ */}
      {faqs?.length > 0 && (
        <Section className="py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionHeading eyebrow="Got Questions?" title="Frequently Asked Questions" subtitle="Everything you need to know before you enroll. Still curious? Reach out anytime." />
            <Accordion type="single" collapsible className="w-full">
              {faqs.slice(0, 6).map((f) => (
                <AccordionItem key={f.id} value={f.id} data-testid={`faq-${f.id}`}>
                  <AccordionTrigger className="text-left font-heading">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Section>
      )}

      {/* BLOG */}
      {blog?.length > 0 && (
        <div className="bg-secondary/40 py-20">
          <Section>
            <div className="flex items-end justify-between gap-4">
              <SectionHeading eyebrow="From Our Blog" title="Latest Articles & Insights" />
              <Button asChild variant="outline" className="hidden rounded-full sm:flex"><Link to="/blog">Read More</Link></Button>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">{blog.slice(0, 3).map((b) => <BlogCard key={b.id} b={b} />)}</div>
          </Section>
        </div>
      )}

      {/* CTA */}
      <Section className="py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-700 p-10 text-center text-white sm:p-16">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your Career?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">Join thousands of successful graduates. Talk to our counsellors today and find the right course for you.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full" data-testid="cta-enquire-btn"><Link to="/enquiry">Enquire Now</Link></Button>
              {settings.phone && <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90"><a href={`tel:${settings.phone}`}><Phone className="mr-1 h-4 w-4" /> {settings.phone}</a></Button>}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export function VideoThumb({ v }) {
  const id = ytId(v.video_url);
  const thumb = v.thumbnail_url ? v.thumbnail_url : (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");
  return (
    <a href={v.video_url} target="_blank" rel="noreferrer" data-testid={`video-${v.id}`}
      className="group relative block aspect-video overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
      {thumb && <img src={thumb} alt={v.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      <div className="absolute inset-0 grid place-items-center bg-slate-950/30">
        <PlayCircle className="h-14 w-14 text-white/90 transition-transform group-hover:scale-110" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3">
        <p className="text-sm font-medium text-white line-clamp-1">{v.title}</p>
      </div>
    </a>
  );
}

export function ytId(url = "") {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}
