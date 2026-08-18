import React from "react";
import { Section } from "@/components/site/SiteLayout";
import { useSite } from "@/context/SiteContext";
import SEO from "@/components/site/SEO";

export function Privacy() {
  const { settings } = useSite();
  return (
    <Section className="max-w-3xl py-16">
      <SEO title="Privacy Policy — CloudWave Technologies" description="Privacy policy of CloudWave Technologies." />
      <h1 className="font-heading text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="prose mt-6 max-w-none space-y-4 text-muted-foreground">
        <p>{settings.institute_name || "CloudWave Technologies"} respects your privacy. This policy explains how we collect, use and protect the information you provide when using our website and enquiry forms.</p>
        <h3 className="font-heading text-foreground">Information We Collect</h3>
        <p>We collect information you voluntarily submit through enquiry and contact forms, including your name, email, phone number, course interest and message. We do not sell your personal data to third parties.</p>
        <h3 className="font-heading text-foreground">How We Use Information</h3>
        <p>We use your information solely to respond to enquiries, provide course guidance, share batch schedules and improve our services. You may request deletion of your data at any time by contacting us.</p>
        <h3 className="font-heading text-foreground">Data Security</h3>
        <p>We implement reasonable technical and organisational measures to protect your data against unauthorised access, alteration or disclosure.</p>
        <h3 className="font-heading text-foreground">Contact</h3>
        <p>For privacy-related questions, email us at {settings.email || "admin@cloudwavetechnologies.org"}.</p>
      </div>
    </Section>
  );
}

export function Terms() {
  const { settings } = useSite();
  return (
    <Section className="max-w-3xl py-16">
      <SEO title="Terms & Conditions — CloudWave Technologies" description="Terms and conditions of CloudWave Technologies." />
      <h1 className="font-heading text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
      <div className="prose mt-6 max-w-none space-y-4 text-muted-foreground">
        <p>By accessing and using the {settings.institute_name || "CloudWave Technologies"} website, you agree to the following terms and conditions.</p>
        <h3 className="font-heading text-foreground">Use of Website</h3>
        <p>Content on this website is for informational purposes. Course details, fees and schedules are subject to change without notice.</p>
        <h3 className="font-heading text-foreground">Enrolments & Fees</h3>
        <p>Enrolment is confirmed upon fee payment. Refund and rescheduling policies are shared at the time of admission.</p>
        <h3 className="font-heading text-foreground">Intellectual Property</h3>
        <p>All training material, logos and content are the property of {settings.institute_name || "CloudWave Technologies"} and may not be reproduced without permission.</p>
        <h3 className="font-heading text-foreground">Contact</h3>
        <p>For questions regarding these terms, contact us at {settings.email || "admin@cloudwavetechnologies.org"}.</p>
      </div>
    </Section>
  );
}
