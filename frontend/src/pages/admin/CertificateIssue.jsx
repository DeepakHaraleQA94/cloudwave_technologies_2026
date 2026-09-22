import React, { useState } from "react";
import { toast } from "sonner";
import { Search, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API, formatApiError } from "@/lib/api";

const EMPTY = { student_id_ref: "", student_name: "", student_ref: "", internship_role: "", department: "", technology: "", start_date: "", end_date: "", duration: "", completion_date: "", authorized_person: "", designation: "" };

export default function CertificateIssue() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [issued, setIssued] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const search = async () => {
    try { const r = await api.get(`/admin/students?search=${encodeURIComponent(q)}&page_size=10`); setResults(r.data.items || []); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const pick = (s) => { setForm((p) => ({ ...p, student_id_ref: s.id, student_name: s.full_name, student_ref: s.student_id })); setResults([]); };
  const issue = async () => {
    if (!form.student_name || !form.internship_role) { toast.error("Student name and internship role are required"); return; }
    try { const r = await api.post("/admin/certificates/internship", form); setIssued(r.data); toast.success("Internship certificate created"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const F = ({ label, k, type = "text" }) => (<div><Label className="mb-1 block text-xs">{label}</Label><Input type={type} value={form[k]} onChange={(e) => set(k, e.target.value)} data-testid={`cert-${k}`} /></div>);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Issue Internship Certificate</h1>
        <p className="text-sm text-muted-foreground">Course completion certificates are generated automatically when a student passes the Final Course Test. Use this page to manually issue internship certificates.</p>
      </div>

      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search student by ID, name, email or mobile (optional)" data-testid="cert-search-input" />
        <Button onClick={search} data-testid="cert-search-btn"><Search className="mr-1 h-4 w-4" /> Search</Button>
      </div>
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          {results.map((s) => (
            <button key={s.id} onClick={() => pick(s)} className="flex w-full items-center justify-between border-b border-border p-3 text-left last:border-b-0 hover:bg-secondary" data-testid={`cert-result-${s.id}`}>
              <span className="font-medium">{s.full_name}</span><span className="text-xs text-muted-foreground">{s.student_id} · {s.email}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <F label="Student Name" k="student_name" /><F label="Student ID" k="student_ref" />
        <F label="Internship Role" k="internship_role" /><F label="Department" k="department" />
        <F label="Technology / Domain" k="technology" /><F label="Duration (e.g. 3 Months)" k="duration" />
        <F label="Start Date" k="start_date" type="date" /><F label="End Date" k="end_date" type="date" />
        <F label="Completion Date" k="completion_date" type="date" />
        <F label="Authorized Person" k="authorized_person" /><F label="Designation" k="designation" />
      </div>
      <Button onClick={issue} data-testid="cert-issue-btn"><Award className="mr-1 h-4 w-4" /> Generate Certificate</Button>

      {issued && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4" data-testid="cert-issued">
          <div><p className="font-medium">Certificate created</p><p className="text-xs text-muted-foreground">ID: {issued.certificate_id}</p></div>
          <a href={`${API}/certificates/${encodeURIComponent(issued.certificate_id)}/download`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><Download className="mr-1 h-3.5 w-3.5" /> Download PDF</Button>
          </a>
        </div>
      )}
    </div>
  );
}
