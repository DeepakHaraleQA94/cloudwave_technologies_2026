import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Award, ArrowRight, MapPin, Calendar, Users, Linkedin, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mediaUrl, formatINR } from "@/lib/api";

const FALLBACK = {
  course: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=70",
  trainer: "https://images.pexels.com/photos/67112/pexels-photo-67112.jpeg?auto=compress&cs=tinysrgb&w=600",
  gallery: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=70",
  student: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=70",
  blog: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=70",
};

export function CourseCard({ c }) {
  return (
    <Link to={`/courses/${c.slug || c.id}`} data-testid={`course-card-${c.slug || c.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img src={mediaUrl(c.image_url) || FALLBACK.course} alt={c.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {c.featured && <Badge className="absolute left-3 top-3 bg-brand-accent text-white">Featured</Badge>}
        <Badge variant="secondary" className="absolute right-3 top-3">{c.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold leading-snug group-hover:text-primary">{c.name}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{c.short_description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration}</span>
          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {c.level}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            {c.discounted_fee ? (
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold text-primary">{formatINR(c.discounted_fee)}</span>
                <span className="text-sm text-muted-foreground line-through">{formatINR(c.fee)}</span>
              </div>
            ) : <span className="font-heading text-lg font-bold text-primary">{formatINR(c.fee)}</span>}
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-primary">View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

export function TrainerCard({ t }) {
  return (
    <div data-testid={`trainer-card-${t.id}`} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-square overflow-hidden bg-muted">
        <img src={mediaUrl(t.photo_url) || FALLBACK.trainer} alt={t.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold">{t.name}</h3>
        <p className="text-sm text-primary">{t.designation}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.experience} experience</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(t.skills || []).slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
        </div>
        {t.linkedin && <a href={t.linkedin} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
      </div>
    </div>
  );
}

export function TestimonialCard({ t }) {
  return (
    <div data-testid={`testimonial-${t.id}`} className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < (t.rating || 5) ? "fill-brand-accent text-brand-accent" : "text-muted"}`} />)}</div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">“{t.text}”</p>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-base font-bold text-primary">{(t.name || "?").charAt(0).toUpperCase()}</span>
        <div>
          <p className="font-heading text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.course}</p>
        </div>
      </div>
    </div>
  );
}

export function PlacementCard({ p }) {
  return (
    <div data-testid={`placement-${p.id}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={mediaUrl(p.student_photo) || FALLBACK.student} alt={p.student_name} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
          <p className="font-heading text-base font-semibold text-white">{p.student_name}</p>
          <p className="text-xs text-slate-200">{p.job_title}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="flex items-center gap-1.5 text-sm font-medium"><Building2 className="h-4 w-4 text-primary" /> {p.company_name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{p.course} · {p.placement_year}</p>
      </div>
    </div>
  );
}

export function BlogCard({ b }) {
  return (
    <Link to={`/blog/${b.slug}`} data-testid={`blog-card-${b.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-video overflow-hidden bg-muted">
        <img src={mediaUrl(b.image_url) || FALLBACK.blog} alt={b.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Badge variant="secondary" className="w-fit">{b.category}</Badge>
        <h3 className="mt-3 font-heading text-lg font-semibold leading-snug group-hover:text-primary">{b.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{b.excerpt}</p>
        <p className="mt-4 text-xs text-muted-foreground">By {b.author} · {(b.created_at || "").slice(0, 10)}</p>
      </div>
    </Link>
  );
}

export function BatchRow({ b }) {
  const colors = { "Upcoming": "bg-blue-100 text-blue-700", "Filling Fast": "bg-orange-100 text-orange-700", "Started": "bg-green-100 text-green-700", "Completed": "bg-slate-100 text-slate-600", "Cancelled": "bg-red-100 text-red-700" };
  return (
    <div data-testid={`batch-${b.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-semibold">{b.course_name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[b.status] || colors.Upcoming}`}>{b.status}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.start_date}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {b.time}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {b.seats} seats</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.mode}</span>
        </div>
      </div>
      <Button asChild variant="outline" className="rounded-full shrink-0">
        <Link to={`/enquiry?batch=${b.id}&course=${b.course_id}`} data-testid={`batch-enquire-${b.id}`}>Enquire</Link>
      </Button>
    </div>
  );
}
