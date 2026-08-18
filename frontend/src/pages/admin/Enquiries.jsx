import React, { useEffect, useState, useCallback } from "react";
import { Search, Download, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, API, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["New", "Contacted", "Follow-up", "Interested", "Registered", "Converted", "Not Interested", "Closed"];
const STATUS_COLOR = { New: "bg-blue-100 text-blue-700", Contacted: "bg-indigo-100 text-indigo-700", "Follow-up": "bg-amber-100 text-amber-700", Interested: "bg-cyan-100 text-cyan-700", Registered: "bg-violet-100 text-violet-700", Converted: "bg-green-100 text-green-700", "Not Interested": "bg-red-100 text-red-700", Closed: "bg-slate-100 text-slate-600" };

export default function Enquiries() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [view, setView] = useState(null);
  const [note, setNote] = useState("");
  const [delId, setDelId] = useState(null);
  const pageSize = 15;

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/enquiries", { params: { search, status, page, page_size: pageSize } })
      .then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [search, status, page]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const updateStatus = async (id, s) => {
    await api.put(`/admin/enquiries/${id}`, { status: s });
    toast.success("Status updated");
    setView((v) => v && v.id === id ? { ...v, status: s } : v);
    load();
  };
  const updateFollowup = async (id, d) => { await api.put(`/admin/enquiries/${id}`, { follow_up_date: d }); load(); };
  const addNote = async () => {
    if (!note.trim()) return;
    const { data: n } = await api.post(`/admin/enquiries/${view.id}/notes`, { text: note });
    setView({ ...view, notes: [...(view.notes || []), n] });
    setNote(""); toast.success("Note added");
  };
  const del = async () => {
    try { await api.delete(`/admin/enquiries/${delId}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setDelId(null); }
  };
  const exportCsv = async () => {
    try {
      const res = await api.get("/admin/enquiries-export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = "enquiries.csv"; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-bold">Enquiries</h1><p className="text-sm text-muted-foreground">{data.total} total enquiries</p></div>
        <Button onClick={exportCsv} variant="outline" data-testid="export-csv-btn"><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, mobile, email, ID, course..." className="pl-9" data-testid="enquiry-search" /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44" data-testid="enquiry-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : data.items.length === 0 ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No enquiries found</TableCell></TableRow>
            : data.items.map((e) => (
              <TableRow key={e.id} data-testid={`enquiry-row-${e.id}`}>
                <TableCell className="font-mono text-xs">{e.enquiry_id}</TableCell>
                <TableCell className="font-medium">{e.name}{e.high_intent && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700" data-testid={`high-intent-${e.id}`}>High Intent</span>}</TableCell>
                <TableCell>{e.mobile}</TableCell>
                <TableCell className="max-w-[140px]"><span className="line-clamp-1">{e.course_name || "—"}</span></TableCell>
                <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status] || ""}`}>{e.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{(e.created_at || "").slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setView(e); setNote(""); }} data-testid={`view-enquiry-${e.id}`}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDelId(e.id)} data-testid={`delete-enquiry-${e.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {view && (
            <>
              <DialogHeader><DialogTitle>{view.name} <span className="font-mono text-sm text-muted-foreground">({view.enquiry_id})</span></DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <Detail label="Email" value={view.email} />
                <Detail label="Mobile" value={view.mobile} />
                <Detail label="WhatsApp" value={view.whatsapp} />
                <Detail label="Course" value={view.course_name} />
                <Detail label="Batch" value={view.batch_name} />
                <Detail label="Mode" value={view.mode} />
                <Detail label="City" value={view.city} />
                <Detail label="Source" value={view.source} />
                <Detail label="Message" value={view.message} />
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="mb-1 block text-xs">Status</Label>
                    <Select value={view.status} onValueChange={(v) => updateStatus(view.id, v)}>
                      <SelectTrigger data-testid="enquiry-status-select"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="mb-1 block text-xs">Follow-up Date</Label><Input type="date" value={view.follow_up_date || ""} onChange={(e) => { setView({ ...view, follow_up_date: e.target.value }); updateFollowup(view.id, e.target.value); }} data-testid="enquiry-followup" /></div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Notes</Label>
                  <div className="space-y-2">
                    {(view.notes || []).map((n) => <div key={n.id} className="rounded-lg bg-secondary/60 p-2 text-xs"><p>{n.text}</p><p className="mt-1 text-muted-foreground">{n.author} · {(n.created_at || "").slice(0, 16).replace("T", " ")}</p></div>)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a follow-up note..." data-testid="enquiry-note-input" />
                    <Button onClick={addNote} data-testid="add-note-btn">Add</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this enquiry?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-enquiry">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return <div className="flex justify-between gap-4 border-b border-border pb-1.5"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>;
}
