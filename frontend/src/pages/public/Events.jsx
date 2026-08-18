import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/usePublic";
import { mediaUrl } from "@/lib/api";
import SEO from "@/components/site/SEO";

const FALLBACK = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=70";

export default function Events() {
  const { data, loading } = useGet("/events");
  return (
    <div>
      <SEO title="Events & Celebrations — CloudWave Technologies" description="Workshops, seminars, placement drives and celebrations at CloudWave Technologies." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Happenings" title="Events & Celebrations" subtitle="Workshops, seminars, placement drives and student celebrations." /></Section></div>
      <Section className="py-12">
        {loading ? <Loader /> : !data?.length ? <Empty title="No events yet" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((e) => (
              <div key={e.id} data-testid={`event-${e.id}`} className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-video overflow-hidden bg-muted"><img src={mediaUrl(e.cover_image) || FALLBACK} alt={e.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="p-5">
                  <Badge variant="secondary">{e.category}</Badge>
                  <h3 className="mt-3 font-heading text-lg font-semibold">{e.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {e.event_date}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.location}</span>
                  </div>
                  <Button asChild variant="link" className="mt-2 px-0"><Link to={`/enquiry`}>Register / Enquire <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
