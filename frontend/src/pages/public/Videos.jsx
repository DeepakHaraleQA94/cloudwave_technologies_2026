import React, { useState, useMemo } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { VideoThumb } from "@/pages/public/Home";
import { useGet } from "@/hooks/usePublic";
import { useSite } from "@/context/SiteContext";
import { Youtube } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function Videos() {
  const { data, loading } = useGet("/videos");
  const { settings } = useSite();
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set((data || []).map((v) => v.category))], [data]);
  const filtered = (data || []).filter((v) => cat === "All" || v.category === cat);
  return (
    <div>
      <SEO title="Video Gallery — CloudWave Technologies" description="Watch training demos, student success stories and institute event videos." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Watch" title="Video Gallery" subtitle="Training demos, success stories and highlights from our institute." /></Section></div>
      <Section className="py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">{cats.map((c) => <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{c}</Button>)}</div>
          {settings.youtube_channel && <Button asChild variant="outline" className="rounded-full"><a href={settings.youtube_channel} target="_blank" rel="noreferrer"><Youtube className="mr-1 h-4 w-4 text-red-600" /> Our YouTube Channel</a></Button>}
        </div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No videos yet" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((v) => <VideoThumb key={v.id} v={v} />)}</div>
        )}
      </Section>
    </div>
  );
}
