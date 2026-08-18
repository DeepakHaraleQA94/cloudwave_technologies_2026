import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, ShieldCheck, ShieldX, Search, Loader2, GraduationCap, Calendar, Award, Download } from "lucide-react";
import { Section } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { useSite } from "@/context/SiteContext";
import SEO from "@/components/site/SEO";

export default function VerifyCertificate() {
  const { settings } = useSite();
  const [params] = useSearchParams();
  const [cid, setCid] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | valid | invalid
  const [cert, setCert] = useState(null);

  const verify = async (id) => {
    const q = (id ?? cid).trim();
    if (!q) return;
    setState("loading"); setCert(null);
    try {
      const { data } = await api.get(`/certificates/verify`, { params: { cid: q } });
      setCert(data); setState("valid");
    } catch {
      setState("invalid");
    }
  };

  useEffect(() => {
    const q = params.get("id");
    if (q) { setCid(q); verify(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SEO title="Verify Certificate — CloudWave Technologies" description="Verify the authenticity of a CloudWave Technologies course completion certificate by its ID." />
      <div className="bg-slate-950 text-white">
        <Section className="py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><BadgeCheck className="h-7 w-7" /></span>
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Certificate Verification</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Enter the certificate ID printed on your CloudWave Technologies certificate to confirm its authenticity.</p>
        </Section>
      </div>

      <Section className="max-w-xl py-14">
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Label htmlFor="cid" className="mb-1.5 block">Certificate ID</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input id="cid" value={cid} onChange={(e) => setCid(e.target.value)} placeholder="e.g. CWT-2026-0001" data-testid="verify-input" />
            <Button type="submit" disabled={state === "loading"} className="rounded-full" data-testid="verify-btn">
              {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-1 h-4 w-4" /> Verify</>}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Try a sample: CWT-2026-0001</p>
        </form>

        {state === "valid" && cert && (
          <div className="mt-6 overflow-hidden rounded-2xl border-2 border-green-500/40 bg-card shadow-sm" data-testid="verify-result-valid">
            <div className="flex items-center gap-3 bg-green-50 px-6 py-4 text-green-700">
              <ShieldCheck className="h-6 w-6" />
              <p className="font-heading text-lg font-semibold">Certificate Verified</p>
            </div>
            <div className="space-y-4 p-6">
              <Row Icon={BadgeCheck} label="Certificate ID" value={cert.certificate_id} />
              <Row Icon={GraduationCap} label="Student Name" value={cert.student_name} />
              <Row Icon={Award} label="Course Completed" value={cert.course} />
              <Row Icon={Calendar} label="Issue Date" value={cert.issue_date} />
              {cert.grade && <Row Icon={Award} label="Grade" value={cert.grade} />}
              <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">This certificate was issued by {settings.institute_name || "CloudWave Technologies"} and is authentic.</p>
              <Button asChild className="w-full rounded-full" data-testid="download-certificate-btn">
                <a href={`${API}/certificates/${encodeURIComponent(cert.certificate_id)}/download`}>
                  <Download className="mr-1 h-4 w-4" /> Download Certificate (PDF)
                </a>
              </Button>
            </div>
          </div>
        )}

        {state === "invalid" && (
          <div className="mt-6 rounded-2xl border-2 border-destructive/40 bg-card p-6 text-center shadow-sm" data-testid="verify-result-invalid">
            <ShieldX className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-3 font-heading text-lg font-semibold">No Valid Certificate Found</p>
            <p className="mt-1 text-sm text-muted-foreground">We couldn't find a valid certificate with that ID. Please check the ID and try again, or contact us for assistance.</p>
          </div>
        )}
      </Section>
    </div>
  );
}

function Row({ Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4 text-primary" /> {label}</span>
      <span className="text-right font-heading font-semibold">{value}</span>
    </div>
  );
}
