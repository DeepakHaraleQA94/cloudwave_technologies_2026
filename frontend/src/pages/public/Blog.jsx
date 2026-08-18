import React, { useMemo, useState } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { BlogCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/usePublic";
import SEO from "@/components/site/SEO";

export default function Blog() {
  const { data, loading } = useGet("/blog");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set((data || []).map((b) => b.category))], [data]);
  const filtered = (data || []).filter((b) => cat === "All" || b.category === cat);
  return (
    <div>
      <SEO title="Blog & Articles — CloudWave Technologies" description="IT career tips, technology insights and training guides from CloudWave Technologies." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Insights" title="Blog & Articles" subtitle="Career tips, tech trends and guides to help you grow." /></Section></div>
      <Section className="py-12">
        <div className="mb-6 flex flex-wrap gap-2">{cats.map((c) => <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{c}</Button>)}</div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No articles yet" /> : (
          <div className="grid gap-6 md:grid-cols-3">{filtered.map((b) => <BlogCard key={b.id} b={b} />)}</div>
        )}
      </Section>
    </div>
  );
}
