import React, { useState, useMemo } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { PlacementCard } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import { Button } from "@/components/ui/button";
import SEO from "@/components/site/SEO";

export default function Placements() {
  const { data, loading } = useGet("/placements");
  const [course, setCourse] = useState("All");
  const [year, setYear] = useState("All");

  const courses = useMemo(() => ["All", ...new Set((data || []).map((p) => p.course))], [data]);
  const years = useMemo(() => ["All", ...new Set((data || []).map((p) => p.placement_year))], [data]);
  const filtered = (data || []).filter((p) => (course === "All" || p.course === course) && (year === "All" || p.placement_year === year));

  return (
    <div>
      <SEO title="Placements & Success Stories — CloudWave Technologies" description="Meet our placed students and their success stories across top companies." />
      <div className="bg-slate-950 text-white"><Section className="py-16"><SectionHeading eyebrow="Success Stories" title="Our Students. Placed & Thriving." subtitle="Real students, real placements. See where our graduates work today." className="[&_h2]:text-white [&_p]:text-slate-300" /></Section></div>
      <Section className="py-12">
        <div className="mb-8 flex flex-wrap gap-2">
          {courses.map((c) => <Button key={"c" + c} size="sm" variant={course === c ? "default" : "outline"} className="rounded-full" onClick={() => setCourse(c)}>{c}</Button>)}
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {years.map((y) => <Button key={"y" + y} size="sm" variant={year === y ? "secondary" : "ghost"} className="rounded-full" onClick={() => setYear(y)}>{y}</Button>)}
        </div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No placements found" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((p) => <PlacementCard key={p.id} p={p} />)}</div>
        )}
      </Section>
    </div>
  );
}
