import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Section } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGet } from "@/hooks/usePublic";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import SEO from "@/components/site/SEO";

const MODES = ["Online", "Classroom", "Hybrid"];

export default function Enquiry() {
  const [params] = useSearchParams();
  const { data: courses } = useGet("/courses");
  const { data: batches } = useGet("/batches");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", whatsapp: "", course_id: "", batch_id: "", mode: "", city: "", message: "", consent: false });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    const c = params.get("course"), b = params.get("batch");
    setForm((f) => ({ ...f, course_id: c || f.course_id, batch_id: b || f.batch_id }));
  }, [params]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const courseBatches = (batches || []).filter((b) => !form.course_id || b.course_id === form.course_id);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\D/g, "").slice(-10))) e.mobile = "Valid 10-digit Indian mobile required";
    if (!form.course_id) e.course_id = "Please select a course";
    if (!form.consent) e.consent = "Consent is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending || !validate()) return;
    setSending(true);
    const course = (courses || []).find((c) => c.id === form.course_id);
    const batch = (batches || []).find((b) => b.id === form.batch_id);
    try {
      const { data } = await api.post("/enquiries", {
        ...form, course_name: course?.name || "", batch_name: batch ? `${batch.course_name} - ${batch.start_date}` : "", source: "Website Enquiry",
      });
      setDone(data.enquiry_id);
      toast.success("Enquiry submitted successfully!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSending(false); }
  };

  if (done) return (
    <Section className="py-24 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 shadow-sm">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Thank You!</h1>
        <p className="mt-2 text-muted-foreground">Your enquiry has been received. Our team will contact you shortly.</p>
        <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm">Your Enquiry ID: <strong className="text-primary" data-testid="enquiry-id">{done}</strong></p>
        <Button className="mt-6 rounded-full" onClick={() => { setDone(null); setForm({ name: "", email: "", mobile: "", whatsapp: "", course_id: "", batch_id: "", mode: "", city: "", message: "", consent: false }); }}>Submit Another</Button>
      </div>
    </Section>
  );

  return (
    <div>
      <SEO title="Enquire / Register — CloudWave Technologies" description="Submit an enquiry and our counsellors will help you get started." />
      <div className="border-b border-border bg-secondary/40"><Section className="py-14"><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Course Enquiry</h1><p className="mt-2 max-w-xl text-muted-foreground">Fill in your details and our team will reach out with course guidance, fees and batch schedules.</p></Section></div>
      <Section className="py-14">
        <form onSubmit={submit} className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="enquiry-form" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name *" err={errors.name}><Input value={form.name} onChange={set("name")} data-testid="enquiry-name" /></Field>
            <Field label="Email *" err={errors.email}><Input type="email" value={form.email} onChange={set("email")} data-testid="enquiry-email" /></Field>
            <Field label="Mobile Number *" err={errors.mobile}><Input value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile" data-testid="enquiry-mobile" /></Field>
            <Field label="WhatsApp Number"><Input value={form.whatsapp} onChange={set("whatsapp")} data-testid="enquiry-whatsapp" /></Field>
            <Field label="Course *" err={errors.course_id}>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v, batch_id: "" })}>
                <SelectTrigger data-testid="enquiry-course"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>{(courses || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Batch">
              <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                <SelectTrigger data-testid="enquiry-batch"><SelectValue placeholder="Any batch" /></SelectTrigger>
                <SelectContent>{courseBatches.length ? courseBatches.map((b) => <SelectItem key={b.id} value={b.id}>{b.course_name} — {b.start_date}</SelectItem>) : <SelectItem value="none" disabled>No batches</SelectItem>}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Mode">
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger data-testid="enquiry-mode"><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>{MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="City"><Input value={form.city} onChange={set("city")} data-testid="enquiry-city" /></Field>
          </div>
          <div className="mt-5"><Field label="Message"><Textarea rows={3} value={form.message} onChange={set("message")} data-testid="enquiry-message" /></Field></div>
          <div className="mt-5 flex items-start gap-2">
            <Checkbox id="consent" checked={form.consent} onCheckedChange={(v) => setForm({ ...form, consent: !!v })} data-testid="enquiry-consent" />
            <label htmlFor="consent" className="text-sm text-muted-foreground">I consent to being contacted by {`CloudWave Technologies`} regarding my enquiry. *</label>
          </div>
          {errors.consent && <p className="mt-1 text-xs text-destructive">{errors.consent}</p>}
          <Button type="submit" disabled={sending} className="mt-6 w-full rounded-full" size="lg" data-testid="enquiry-submit">{sending ? "Submitting..." : "Submit Enquiry"}</Button>
        </form>
      </Section>
    </div>
  );
}

function Field({ label, err, children }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}{err && <p className="mt-1 text-xs text-destructive">{err}</p>}</div>;
}
