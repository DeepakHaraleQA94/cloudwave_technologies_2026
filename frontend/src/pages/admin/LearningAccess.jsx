import React, { useState } from "react";
import { toast } from "sonner";
import { Search, Lock, Unlock, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, formatApiError, formatINR } from "@/lib/api";

const statusColor = { GRANTED: "bg-green-100 text-green-700", REVOKED: "bg-red-100 text-red-700", NONE: "bg-slate-100 text-slate-600" };

export default function LearningAccess() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [data, setData] = useState(null);
  const [pw, setPw] = useState("");
  const [dates, setDates] = useState({ start_date: "", expiry_date: "" });
  const [busy, setBusy] = useState(false);

  const search = async () => {
    try {
      const r = await api.get(`/admin/students?search=${encodeURIComponent(q)}&page_size=10`);
      setResults(r.data.items || []);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const pick = async (s) => {
    setResults([]);
    try { const r = await api.get(`/admin/students/${s.id}/learning`); setData(r.data); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const reload = () => data && pick({ id: data.student.id });

  const grant = async (rid) => act("grant", [rid]);
  const revoke = async (rid) => act("revoke", [rid]);
  const act = async (kind, resource_ids) => {
    setBusy(true);
    try {
      await api.post(`/admin/entitlements/${kind}`, { student_ids: [data.student.id], resource_ids, start_date: dates.start_date || null, expiry_date: dates.expiry_date || null });
      toast.success(kind === "grant" ? "Access granted" : "Access revoked");
      reload();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  const grantAll = async () => act("grant", data.resources.map((r) => r.id));

  const setPassword = async () => {
    if (pw.length < 6) { toast.error("Min 6 characters"); return; }
    try { await api.post(`/admin/students/${data.student.id}/set-password`, { password: pw }); toast.success("Student password set"); setPw(""); reload(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Learning Access</h1>
        <p className="text-sm text-muted-foreground">Search a student and grant/revoke access to individual learning resources.</p>
      </div>

      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search by Student ID, name, email or mobile" data-testid="la-search-input" />
        <Button onClick={search} data-testid="la-search-btn"><Search className="mr-1 h-4 w-4" /> Search</Button>
      </div>
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          {results.map((s) => (
            <button key={s.id} onClick={() => pick(s)} className="flex w-full items-center justify-between border-b border-border p-3 text-left last:border-b-0 hover:bg-secondary" data-testid={`la-result-${s.id}`}>
              <span><span className="font-medium">{s.full_name}</span> <span className="text-xs text-muted-foreground">{s.student_id} · {s.email}</span></span>
              <span className="text-xs text-muted-foreground">{s.course_name}</span>
            </button>
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-5" data-testid="la-student-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-heading text-lg font-bold">{data.student.full_name}</p>
              <p className="text-sm text-muted-foreground">{data.student.student_id} · {data.student.email}</p>
            </div>
            <Badge className={data.fee.payment_status === "PAID" ? "bg-green-100 text-green-700" : data.fee.payment_status === "PARTIAL" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
              {data.fee.payment_status} · Paid {formatINR(data.fee.paid)} / {formatINR(data.fee.total_fee)}
            </Badge>
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label className="mb-1 block text-xs">Access Start (optional)</Label><Input type="date" value={dates.start_date} onChange={(e) => setDates((d) => ({ ...d, start_date: e.target.value }))} data-testid="la-start-date" /></div>
            <div><Label className="mb-1 block text-xs">Access Expiry (optional)</Label><Input type="date" value={dates.expiry_date} onChange={(e) => setDates((d) => ({ ...d, expiry_date: e.target.value }))} data-testid="la-expiry-date" /></div>
            <div className="flex items-end"><Button variant="outline" className="w-full" onClick={grantAll} disabled={busy} data-testid="la-grant-all">Grant All</Button></div>
            <div className="flex items-end gap-2">
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Set login password" data-testid="la-password-input" />
              <Button variant="outline" onClick={setPassword} data-testid="la-set-password"><KeyRound className="h-4 w-4" /></Button>
            </div>
          </div>
          {!data.has_password && <p className="text-xs text-amber-600">This student has no login password yet — set one above so they can access the portal.</p>}

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {data.resources.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No learning resources exist for this student's course. Add them in Learning Studio.</p> :
              data.resources.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 last:border-b-0" data-testid={`la-resource-${r.id}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.resource_type} · {r.module || "General"}{r.expiry_date ? ` · expires ${r.expiry_date}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor[r.access_status] || statusColor.NONE}>{r.access_status}</Badge>
                    {r.access_status === "GRANTED" ?
                      <Button size="sm" variant="outline" onClick={() => revoke(r.id)} disabled={busy} data-testid={`la-revoke-${r.id}`}><Lock className="mr-1 h-3.5 w-3.5" /> Revoke</Button> :
                      <Button size="sm" onClick={() => grant(r.id)} disabled={busy} data-testid={`la-grant-${r.id}`}><Unlock className="mr-1 h-3.5 w-3.5" /> Grant</Button>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
