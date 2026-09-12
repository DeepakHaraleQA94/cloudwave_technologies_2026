import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, Award, Layers, IndianRupee, GraduationCap, CheckCircle2, Briefcase, MessageCircle, Phone } from "lucide-react";
import { Section, Loader, Empty } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useGet } from "@/hooks/usePublic";
import { useSite } from "@/context/SiteContext";
import { mediaUrl, formatINR } from "@/lib/api";
import { BatchRow, TestimonialCard } from "@/components/site/cards";
import BuyCourse from "@/components/site/BuyCourse";
import SEO from "@/components/site/SEO";

const FALLBACK = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=70";

export default function CourseDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { settings } = useSite();
  const { data: c, loading, error } = useGet(`/courses/${slug}`, [slug]);
  const { data: batches } = useGet(`/batches?course_id=${c?.id || ""}`, [c?.id]);
  const { data: trainers } = useGet("/trainers");
  const { data: testimonials } = useGet("/testimonials");

  if (loading) return <Loader />;
  if (error || !c) return <Section className="py-20"><Empty title="Course not found" subtitle="This course may have been removed." /></Section>;

  const waMsg = encodeURIComponent(`Hello, I would like to know more about the ${c.name} course.`);
  const courseBatches = (batches || []).filter((b) => b.course_id === c.id);

  return (
    <div>
      <SEO title={`${c.name} — CloudWave Technologies`} description={c.short_description} canonical={`/courses/${c.slug}`} />
      <div className="bg-slate-950 text-white">
        <Section className="grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-3">{c.category}</Badge>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{c.name}</h1>
            <p className="mt-4 text-slate-300">{c.short_description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-accent" /> {c.duration}</span>
              <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-brand-accent" /> {c.level}</span>
              <span className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-brand-accent" /> {c.mode}</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {c.discounted_fee ? (
                <><span className="font-heading text-3xl font-bold">{formatINR(c.discounted_fee)}</span><span className="text-lg text-slate-400 line-through">{formatINR(c.fee)}</span></>
              ) : <span className="font-heading text-3xl font-bold">{formatINR(c.fee)}</span>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" onClick={() => nav(`/enquiry?course=${c.id}`)} data-testid="course-enquire-btn">Enquire About This Course</Button>
              <BuyCourse course={c} />
              {settings.whatsapp && <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"><a href={`https://wa.me/${settings.whatsapp}?text=${waMsg}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" /> WhatsApp</a></Button>}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src={mediaUrl(c.image_url) || FALLBACK} alt={c.name} className="w-full object-cover" />
          </div>
        </Section>
      </div>

      <Section className="grid gap-10 py-14 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <h2 className="font-heading text-2xl font-bold">Overview</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{c.full_description}</p>
          </div>
          {c.learning_outcomes?.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold">What You'll Learn</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {c.learning_outcomes.map((o, i) => <p key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {o}</p>)}
              </div>
            </div>
          )}
          {c.syllabus?.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold">Detailed Syllabus</h2>
              <Accordion type="single" collapsible className="mt-4">
                {c.syllabus.map((m, i) => (
                  <AccordionItem key={i} value={`m${i}`} data-testid={`syllabus-module-${i}`}>
                    <AccordionTrigger className="font-heading">{m.module}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">{(m.topics || []).map((t, j) => <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t}</li>)}</ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
          {c.tools?.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold">Tools & Technologies</h2>
              <div className="mt-4 flex flex-wrap gap-2">{c.tools.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
            </div>
          )}
          {c.career_opportunities?.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold">Career Opportunities</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {c.career_opportunities.map((o, i) => <p key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm"><Briefcase className="h-4 w-4 text-primary" /> {o}</p>)}
              </div>
            </div>
          )}
          {courseBatches.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold">Upcoming Batches</h2>
              <div className="mt-4 space-y-4">{courseBatches.map((b) => <BatchRow key={b.id} b={b} />)}</div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold">Course Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Duration" value={c.duration} Icon={Clock} />
              <Row label="Level" value={c.level} Icon={Award} />
              <Row label="Mode" value={c.mode} Icon={Layers} />
              <Row label="Certification" value={c.certification} Icon={GraduationCap} />
              <Row label="Fee" value={formatINR(c.discounted_fee || c.fee)} Icon={IndianRupee} />
            </dl>
            {c.prerequisites && <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground"><strong className="text-foreground">Prerequisites:</strong> {c.prerequisites}</div>}
            <Button className="mt-5 w-full rounded-full" onClick={() => nav(`/enquiry?course=${c.id}`)} data-testid="course-sidebar-enquire">Enquire Now</Button>
            {settings.phone && <Button asChild variant="outline" className="mt-2 w-full rounded-full"><a href={`tel:${settings.phone}`}><Phone className="mr-1 h-4 w-4" /> Call Now</a></Button>}
          </div>
          {trainers?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-heading text-lg font-semibold">Trainer</h3>
              <div className="mt-4 flex items-center gap-3">
                <img src={mediaUrl(trainers[0].photo_url) || "https://images.pexels.com/photos/67112/pexels-photo-67112.jpeg?auto=compress&cs=tinysrgb&w=200"} alt={trainers[0].name} className="h-14 w-14 rounded-full object-cover" />
                <div><p className="font-heading font-semibold">{trainers[0].name}</p><p className="text-xs text-muted-foreground">{trainers[0].designation}</p></div>
              </div>
            </div>
          )}
        </aside>
      </Section>

      {testimonials?.length > 0 && (
        <div className="bg-secondary/40 py-14">
          <Section>
            <h2 className="font-heading text-2xl font-bold">Student Reviews</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">{testimonials.slice(0, 3).map((t) => <TestimonialCard key={t.id} t={t} />)}</div>
          </Section>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, Icon }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
