import React, { useState, useMemo } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useGet } from "@/hooks/usePublic";
import { mediaUrl } from "@/lib/api";
import SEO from "@/components/site/SEO";

const FALLBACK = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=70";

export default function Gallery() {
  const { data, loading } = useGet("/gallery");
  const [cat, setCat] = useState("All");
  const [idx, setIdx] = useState(null);
  const cats = useMemo(() => ["All", ...new Set((data || []).map((g) => g.category))], [data]);
  const filtered = (data || []).filter((g) => cat === "All" || g.category === cat);

  return (
    <div>
      <SEO title="Photo Gallery — CloudWave Technologies" description="Photos of student activities, placements, workshops, events and celebrations." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Media" title="Photo Gallery" subtitle="A glimpse into life, learning and celebrations at our institute." /></Section></div>
      <Section className="py-12">
        <div className="mb-6 flex flex-wrap gap-2">{cats.map((c) => <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)} data-testid={`gallery-filter-${c}`}>{c}</Button>)}</div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No photos yet" /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((g, i) => (
              <button key={g.id} onClick={() => setIdx(i)} data-testid={`gallery-item-${g.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                <img src={mediaUrl(g.image_url) || FALLBACK} alt={g.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-xs font-medium text-white line-clamp-1">{g.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Dialog open={idx !== null} onOpenChange={(o) => !o && setIdx(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          {idx !== null && filtered[idx] && (
            <div className="relative">
              <img src={mediaUrl(filtered[idx].image_url) || FALLBACK} alt={filtered[idx].title} className="max-h-[80vh] w-full rounded-xl object-contain" />
              <div className="mt-3 text-center text-white"><p className="font-heading font-semibold">{filtered[idx].title}</p><p className="text-sm text-slate-300">{filtered[idx].description}</p></div>
              <button onClick={() => setIdx(null)} className="absolute -top-3 -right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900" data-testid="lightbox-close"><X className="h-5 w-5" /></button>
              <button onClick={() => setIdx((idx - 1 + filtered.length) % filtered.length)} className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900" data-testid="lightbox-prev"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setIdx((idx + 1) % filtered.length)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900" data-testid="lightbox-next"><ChevronRight className="h-5 w-5" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
