import React from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { TestimonialCard } from "@/components/site/cards";
import { useGet } from "@/hooks/usePublic";
import SEO from "@/components/site/SEO";

export default function Reviews() {
  const { data, loading } = useGet("/testimonials");
  return (
    <div>
      <SEO title="Student Reviews — CloudWave Technologies" description="Read honest reviews and testimonials from our students." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Testimonials" title="What Our Students Say" subtitle="Honest words from learners who transformed their careers with us." /></Section></div>
      <Section className="py-12">
        {loading ? <Loader /> : !data?.length ? <Empty title="No reviews yet" /> : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{data.map((t) => <TestimonialCard key={t.id} t={t} />)}</div>
        )}
      </Section>
    </div>
  );
}
