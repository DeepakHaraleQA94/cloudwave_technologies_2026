import React, { useState } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { BatchRow } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import { Button } from "@/components/ui/button";
import SEO from "@/components/site/SEO";

const STATUSES = ["All", "Upcoming", "Filling Fast", "Started"];

export default function Batches() {
  const { data, loading } = useGet("/batches");
  const [f, setF] = useState("All");
  const filtered = (data || []).filter((b) => f === "All" || b.status === f);
  return (
    <div>
      <SEO title="Upcoming Batches — CloudWave Technologies" description="Check upcoming batch schedules and reserve your seat." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Schedules" title="Upcoming Batches" subtitle="Find a batch that fits your schedule and enquire to reserve a seat." /></Section></div>
      <Section className="py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUSES.map((s) => <Button key={s} size="sm" variant={f === s ? "default" : "outline"} className="rounded-full" onClick={() => setF(s)} data-testid={`batch-filter-${s}`}>{s}</Button>)}
        </div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No batches found" /> : (
          <div className="grid max-w-4xl gap-4">{filtered.map((b) => <BatchRow key={b.id} b={b} />)}</div>
        )}
      </Section>
    </div>
  );
}
