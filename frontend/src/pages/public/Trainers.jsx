import React from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { TrainerCard } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import SEO from "@/components/site/SEO";

export default function Trainers() {
  const { data, loading } = useGet("/trainers");
  return (
    <div>
      <SEO title="Trainers & Faculty — CloudWave Technologies" description="Meet our expert IT trainers with years of real industry experience." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Our Faculty" title="Learn From Industry Experts" subtitle="Our trainers are working professionals with deep, real-world experience." /></Section></div>
      <Section className="py-12">
        {loading ? <Loader /> : !data?.length ? <Empty title="No trainers yet" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((t) => <TrainerCard key={t.id} t={t} />)}</div>
        )}
      </Section>
    </div>
  );
}
