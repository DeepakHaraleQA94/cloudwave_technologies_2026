import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Eye, Pencil, Trash2, Download, GraduationCap, UserCheck, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, mediaUrl, formatApiError } from "@/lib/api";
import { ImageUpload } from "./AdminShared";
import { toast } from "sonner";

const STATUS = ["Registered", "Active", "On Hold", "Completed", "Dropped", "Cancelled"];
const PAY = ["Pending", "Partial", "Paid"];
const SC = { Registered: "bg-blue-100 text-blue-700", Active: "bg-green-100 text-green-700", "On Hold": "bg-amber-100 text-amber-700", Completed: "bg-violet-100 text-violet-700", Dropped: "bg-red-100 text-red-700", Cancelled: "bg-slate-100 text-slate-600" };
const EMPTY = { full_name: "", email: "", mobile: "", whatsapp: "", date_of_birth: "", gender: "", city: "", address: "", qualification: "", college: "", graduation_year: "", course_id: "", batch_id: "", trainer: "", training_mode: "", joining_date: "", status: "Registered", payment_status: "Pending", photo_url: "", notes: "" };

export default function Students() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState(null);
  const [delId, setDelId] = useState(null);
  const [seat, setSeat] = useState(null);
  const [saving, setSaving] = useState(false);
  const pageSize = 15;

  const load = useCallback(() => {
    api.get("/admin/students", { params: { search, status: tab, page, page_size: pageSize } }).then((r) => setData(r.data));
    api.get("/admin/students-stats").then((r) => setStats(r.data));
  }, [search, tab, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    api.get("/admin/data/courses").then((r) => setCourses(r.data));
    api.get("/admin/data/batches").then((r) => setBatches(r.data));
  }, []);

  const courseBatches = (form?.course_id ? batches.filter((b) => b.course_id === form.course_id) : batches);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pickBatch = async (bid) => {
    const b = batches.find((x) => x.id === bid);
    set("batch_id", bid);
    if (b) { set("trainer", b.trainer || ""); set("training_mode", b.mode || ""); }
    try { const { data } = await api.get(`/admin/batches/${bid}/students`); setSeat(data); }
    catch { setSeat(null); }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing === "new") await api.post("/admin/students", form);
      else await api.put(`/admin/students/${editing}`, form);
      toast.success("Saved"); setForm(null); setEditing(null); setSeat(null); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };
  const del = async () => {
    try { await api.delete(`/admin/students/${delId}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); } finally { setDelId(null); }
  };
  const openView = async (id) => { const { data } = await api.get(`/admin/students/${id}`); setView(data); };
  const exportCsv = async () => {
    const res = await api.get("/admin/students-export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data); const a = document.createElement("a");
    a.href = url; a.download = "students.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const cards = stats ? [
    { l: "Total Students", v: stats.total, Icon: GraduationCap }, { l: "Active", v: stats.active, Icon: UserCheck },
    { l: "Completed", v: stats.completed, Icon: CheckCircle2 }, { l: "On Hold", v: stats.on_hold, Icon: UserCheck },
  ] : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-bold">Students</h1><p className="text-sm text-muted-foreground">{data.total} enrolled students</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} data-testid="students-export-btn"><Download className="mr-1 h-4 w-4" /> Export</Button>
          <Button onClick={() => { setForm({ ...EMPTY }); setEditing("new"); setSeat(null); }} data-testid="add-student-btn"><Plus className="mr-1 h-4 w-4" /> Add Student</Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.l} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <c.Icon className="h-5 w-5 text-primary" />
            <p className="mt-2 font-heading text-2xl font-bold">{c.v}</p><p className="text-xs text-muted-foreground">{c.l}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "Active", "Completed", "Registered"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} className="rounded-full" onClick={() => { setTab(t); setPage(1); }} data-testid={`students-tab-${t}`}>{t}</Button>
        ))}
        <div className="relative ml-auto"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, ID, mobile, email" className="w-64 pl-9" data-testid="students-search" /></div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead></TableHead><TableHead>Student ID</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead><TableHead>Course</TableHead><TableHead>Batch Timing</TableHead><TableHead>Joining</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.items.length === 0 ? <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No students found</TableCell></TableRow>
            : data.items.map((s) => (
              <TableRow key={s.id} data-testid={`student-row-${s.id}`}>
                <TableCell>{s.photo_url ? <img src={mediaUrl(s.photo_url)} alt={s.full_name} className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{(s.full_name || "?").charAt(0)}</span>}</TableCell>
                <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell>{s.mobile}</TableCell>
                <TableCell className="max-w-[140px]"><span className="line-clamp-1">{s.course_name || "—"}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.batch_timing || "—"}</TableCell>
                <TableCell className="text-xs">{s.joining_date || "—"}</TableCell>
                <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SC[s.status] || ""}`}>{s.status}</span></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openView(s.id)} data-testid={`view-student-${s.id}`}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setForm({ ...EMPTY, ...s }); setEditing(s.id); setSeat(null); }} data-testid={`edit-student-${s.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDelId(s.id)} data-testid={`delete-student-${s.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* Add/Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setForm(null); setSeat(null); } }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? "Add Student" : "Edit Student"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label className="mb-1.5 block">Student Photo</Label><ImageUpload value={form.photo_url} onChange={(v) => set("photo_url", v)} testid="student-photo" /></div>
              <F label="Full Name *"><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} data-testid="student-name" /></F>
              <F label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} /></F>
              <F label="Mobile *"><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} data-testid="student-mobile" /></F>
              <F label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></F>
              <F label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></F>
              <F label="Gender"><Select value={form.gender} onValueChange={(v) => set("gender", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Male", "Female", "Other"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></F>
              <F label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></F>
              <F label="Qualification"><Input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} /></F>
              <F label="College / University"><Input value={form.college} onChange={(e) => set("college", e.target.value)} /></F>
              <F label="Graduation Year"><Input value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} /></F>
              <F label="Course"><Select value={form.course_id} onValueChange={(v) => { set("course_id", v); set("batch_id", ""); setSeat(null); }}><SelectTrigger data-testid="student-course"><SelectValue placeholder="Select course" /></SelectTrigger><SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></F>
              <F label="Batch"><Select value={form.batch_id} onValueChange={pickBatch}><SelectTrigger data-testid="student-batch"><SelectValue placeholder="Select batch" /></SelectTrigger><SelectContent>{courseBatches.length ? courseBatches.map((b) => <SelectItem key={b.id} value={b.id}>{b.course_name} — {b.start_date}</SelectItem>) : <SelectItem value="none" disabled>No batches</SelectItem>}</SelectContent></Select></F>
              {seat && <div className="sm:col-span-2 rounded-lg bg-secondary/60 p-3 text-xs">Batch: {seat.batch?.days} {seat.batch?.time} · Trainer: {seat.batch?.trainer} · Seats: {seat.available} available / {seat.capacity} total {seat.available <= 0 && <span className="font-semibold text-destructive">(FULL)</span>}</div>}
              <F label="Training Mode"><Input value={form.training_mode} onChange={(e) => set("training_mode", e.target.value)} /></F>
              <F label="Joining Date"><Input type="date" value={form.joining_date} onChange={(e) => set("joining_date", e.target.value)} /></F>
              <F label="Status"><Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger data-testid="student-status"><SelectValue /></SelectTrigger><SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></F>
              <F label="Payment Status"><Select value={form.payment_status} onValueChange={(v) => set("payment_status", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></F>
              <div className="sm:col-span-2"><Label className="mb-1.5 block">Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => { setEditing(null); setForm(null); }}>Cancel</Button><Button onClick={save} disabled={saving} data-testid="save-student-btn">{saving ? "Saving..." : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View profile */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {view && (<>
            <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
            <div className="flex items-center gap-4">
              {view.photo_url ? <img src={mediaUrl(view.photo_url)} alt={view.full_name} className="h-16 w-16 rounded-full object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">{(view.full_name || "?").charAt(0)}</span>}
              <div><p className="font-heading text-lg font-semibold">{view.full_name}</p><p className="font-mono text-xs text-muted-foreground">{view.student_id}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SC[view.status] || ""}`}>{view.status}</span></div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <D l="Mobile" v={view.mobile} /><D l="WhatsApp" v={view.whatsapp} /><D l="Email" v={view.email} /><D l="City" v={view.city} /><D l="Qualification" v={view.qualification} /><D l="Payment" v={view.payment_status} />
              <D l="Course" v={view.course_info?.name} /><D l="Duration" v={view.course_info?.duration} />
              {view.batch?.id && <><D l="Batch Start" v={view.batch?.start_date} /><D l="Batch End" v={view.batch?.end_date} /><D l="Days" v={view.batch?.days} /><D l="Time" v={view.batch?.time} /><D l="Trainer" v={view.batch?.trainer} /><D l="Mode" v={view.batch?.mode} /><D l="Location" v={view.batch?.location} /></>}
              <D l="Joining Date" v={view.joining_date} />
            </div>
            {view.enrollments?.length > 0 && (
              <div className="mt-4"><p className="mb-2 font-heading text-sm font-semibold">Enrollment History</p>
                {view.enrollments.map((e) => <div key={e.id} className="mb-2 rounded-lg bg-secondary/60 p-2 text-xs"><p className="font-medium">{e.course_name}</p><p className="text-muted-foreground">{e.batch_label} · {e.status} · joined {e.joining_date}</p></div>)}
              </div>
            )}
            {view.notes && <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-xs"><strong>Notes:</strong> {view.notes}</p>}
          </>)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this student?</AlertDialogTitle><AlertDialogDescription>This removes the student and all enrollment history.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground" data-testid="confirm-delete-student">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function F({ label, children }) { return <div><Label className="mb-1.5 block text-sm">{label}</Label>{children}</div>; }
function D({ l, v }) { if (!v) return null; return <div className="flex justify-between gap-4 border-b border-border pb-1"><span className="text-muted-foreground">{l}</span><span className="text-right font-medium">{v}</span></div>; }
