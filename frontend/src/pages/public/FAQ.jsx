import React, { useMemo, useState } from "react";
import { Section, SectionHeading, Loader, Empty } from "@/components/site/SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/usePublic";
import SEO from "@/components/site/SEO";

export default function FAQ() {
  const { data, loading } = useGet("/faqs");
  const [cat, setCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set((data || []).map((f) => f.category))], [data]);
  const filtered = (data || []).filter((f) => cat === "All" || f.category === cat);
  return (
    <div>
      <SEO title="FAQ — CloudWave Technologies" description="Frequently asked questions about our courses, fees, batches, certification and placements." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Help Center" title="Frequently Asked Questions" subtitle="Answers to the most common questions from our students." /></Section></div>
      <Section className="py-12">
        <div className="mb-6 flex flex-wrap gap-2">{cats.map((c) => <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{c}</Button>)}</div>
        {loading ? <Loader /> : !filtered.length ? <Empty title="No FAQs yet" /> : (
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {filtered.map((f) => (
              <AccordionItem key={f.id} value={f.id} data-testid={`faq-item-${f.id}`}>
                <AccordionTrigger className="text-left font-heading">{f.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Section>
    </div>
  );
}
