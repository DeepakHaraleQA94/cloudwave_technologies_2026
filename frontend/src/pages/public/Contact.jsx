import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSite } from "@/context/SiteContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import SEO from "@/components/site/SEO";

export default function Contact() {
  const { settings } = useSite();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent! We'll get back to you shortly.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSending(false); }
  };

  return (
    <div>
      <SEO title="Contact Us — CloudWave Technologies" description="Get in touch with CloudWave Technologies. Address, phone, email and enquiry form." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><SectionHeading eyebrow="Get in Touch" title="Contact Us" subtitle="Have questions? Our counsellors are here to help you choose the right path." /></Section></div>
      <Section className="grid gap-12 py-14 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { Icon: MapPin, label: "Address", value: settings.address },
            { Icon: Phone, label: "Phone", value: `${settings.phone || ""}${settings.phone_alt ? ", " + settings.phone_alt : ""}`, href: `tel:${settings.phone}` },
            { Icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
            { Icon: Clock, label: "Working Hours", value: settings.working_hours },
          ].map((x) => (
            <div key={x.label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><x.Icon className="h-5 w-5" /></span>
              <div><p className="font-heading text-sm font-semibold">{x.label}</p>{x.href ? <a href={x.href} className="text-sm text-muted-foreground hover:text-primary break-all">{x.value}</a> : <p className="text-sm text-muted-foreground">{x.value}</p>}</div>
            </div>
          ))}
          {settings.whatsapp && <Button asChild className="w-full rounded-full bg-[#25D366] hover:bg-[#1eb457]"><a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" /> Chat on WhatsApp</a></Button>}
          {settings.maps_url && <div className="overflow-hidden rounded-xl border border-border"><iframe title="map" src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || "Pune")}&output=embed`} className="h-56 w-full" loading="lazy" /></div>}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="contact-form">
          <h3 className="font-heading text-xl font-bold">Send us a message</h3>
          <div className="mt-5 space-y-4">
            <div><Label>Name *</Label><Input required value={form.name} onChange={set("name")} data-testid="contact-name" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Email *</Label><Input type="email" required value={form.email} onChange={set("email")} data-testid="contact-email" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} data-testid="contact-phone" /></div>
            </div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={set("subject")} data-testid="contact-subject" /></div>
            <div><Label>Message *</Label><Textarea required rows={4} value={form.message} onChange={set("message")} data-testid="contact-message" /></div>
            <Button type="submit" disabled={sending} className="w-full rounded-full" data-testid="contact-submit">{sending ? "Sending..." : <>Send Message <Send className="ml-1 h-4 w-4" /></>}</Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
