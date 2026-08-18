import React, { useState, useMemo } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { CourseCard } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function Courses() {
  const { data: courses, loading } = useGet("/courses");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const cats = useMemo(() => ["All", ...new Set((courses || []).map((c) => c.category))], [courses]);
  const filtered = (courses || []).filter((c) =>
    (cat === "All" || c.category === cat) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) || (c.short_description || "").toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <SEO title="Courses — CloudWave Technologies" description="Explore industry-ready IT courses in development, cloud, testing and data analytics." />
      <div className="border-b border-border bg-secondary/40">
        <Section className="py-14">
          <SectionHeading eyebrow="Our Programs" title="Courses Designed for Careers" subtitle="Job-oriented, hands-on training across the most in-demand technologies." />
        </Section>
      </div>
      <Section className="py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses..." className="pl-9" data-testid="course-search" />
          </div>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)} data-testid={`course-filter-${c}`}>{c}</Button>
            ))}
          </div>
        </div>
        {loading ? <Loader /> : filtered.length === 0 ? <Empty title="No courses found" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((c) => <CourseCard key={c.id} c={c} />)}</div>
        )}
      </Section>
    </div>
  );
}
