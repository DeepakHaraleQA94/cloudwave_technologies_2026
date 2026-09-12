import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api, formatApiError, formatINR, mediaUrl } from "@/lib/api";
import { toast } from "sonner";
import { RESOURCES, JSON_FIELDS } from "./resourceConfig";
import { FieldRenderer } from "./AdminShared";

export default function ResourceManager() {
  const { resource } = useParams();
  const cfg = RESOURCES[resource];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [batchView, setBatchView] = useState(null);
  const [expForm, setExpForm] = useState({ category: "", description: "", amount: "", expense_date: "" });

  const openBatchStudents = async (b) => {
    try {
      const [s, f] = await Promise.all([
        api.get(`/admin/batches/${b.id}/students`),
        api.get(`/admin/batches/${b.id}/financials`),
      ]);
      setBatchView({ ...s.data, fin: f.data, id: b.id, name: b.course_name });
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const reloadBatchFin = async (bid) => {
    const f = await api.get(`/admin/batches/${bid}/financials`);
    setBatchView((p) => (p ? { ...p, fin: f.data } : p));
  };
  const addExpense = async (bid) => {
    if (!expForm.amount) { toast.error("Enter an amount"); return; }
    try {
      await api.post("/admin/data/expenses", { ...expForm, amount: Number(expForm.amount), batch_id: bid });
      toast.success("Expense added");
      setExpForm({ category: "", description: "", amount: "", expense_date: "" });
      reloadBatchFin(bid);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const delExpense = async (eid, bid) => {
    try { await api.delete(`/admin/data/expenses/${eid}`); reloadBatchFin(bid); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const downloadExcel = async (bid) => {
    try {
      const res = await api.get(`/admin/batches/${bid}/excel`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a"); a.href = url; a.download = `batch-${bid.slice(0, 8)}.xlsx`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const load = () => {
    setLoading(true);
    api.get(`/admin/data/${resource}`).then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); setQ(""); /* eslint-disable-next-line */ }, [resource]);

  if (!cfg) return <div className="p-6">Unknown resource</div>;
  const pubField = cfg.publishField || "published";

  const openNew = () => { setForm({ ...cfg.defaults }); setEditing("new"); };
  const openEdit = (it) => {
    const f = { ...it };
    (JSON_FIELDS[resource] || []).forEach((k) => { f[k] = JSON.stringify(it[k] ?? [], null, 2); });
    setForm(f); setEditing(it.id);
  };
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { ...form };
    (JSON_FIELDS[resource] || []).forEach((k) => {
      if (typeof payload[k] === "string") { try { payload[k] = JSON.parse(payload[k]); } catch { toast.error(`Invalid JSON in ${k}`); } }
    });
    try {
      if (editing === "new") await api.post(`/admin/data/${resource}`, payload);
      else await api.put(`/admin/data/${resource}/${editing}`, payload);
      toast.success("Saved");
      setEditing(null); load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const togglePublish = async (it) => {
    await api.put(`/admin/data/${resource}/${it.id}`, { [pubField]: !it[pubField] });
    load();
  };
  const del = async () => {
    try { await api.delete(`/admin/data/${resource}/${delId}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setDelId(null); }
  };

  const filtered = items.filter((it) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

  const cell = (it, key) => {
    const v = it[key];
    if (key === pubField || key === "featured" || key === "is_active" || key === "active" || key === "published")
      return <Badge variant={v ? "default" : "secondary"}>{v ? "Yes" : "No"}</Badge>;
    if (key === "fee") return formatINR(v);
    if (key === "status") return <Badge variant="outline">{v}</Badge>;
    return <span className="line-clamp-1">{String(v ?? "")}</span>;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-bold">{cfg.title}</h1><p className="text-sm text-muted-foreground">{items.length} total</p></div>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-48 pl-9" data-testid="resource-search" /></div>
          <Button onClick={openNew} data-testid="resource-add-btn"><Plus className="mr-1 h-4 w-4" /> Add {cfg.singular}</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>{cfg.columns.map(([k, l]) => <TableHead key={k}>{l}</TableHead>)}<TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={cfg.columns.length + 1} className="py-10 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={cfg.columns.length + 1} className="py-10 text-center text-muted-foreground">No records</TableCell></TableRow>
            : filtered.map((it) => (
              <TableRow key={it.id} data-testid={`row-${it.id}`}>
                {cfg.columns.map(([k]) => <TableCell key={k}>{(k === pubField) ? <button onClick={() => togglePublish(it)} data-testid={`toggle-${it.id}`}>{cell(it, k)}</button> : cell(it, k)}</TableCell>)}
                <TableCell className="text-right">
                  {resource === "batches" && (
                    <Button size="icon" variant="ghost" title="View students" data-testid={`batch-students-${it.id}`} onClick={() => openBatchStudents(it)}>
                      <Users className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  {resource === "themes" && (
                    <Button size="icon" variant="ghost" title="Preview live" data-testid={`preview-${it.id}`}
                      onClick={() => { sessionStorage.setItem("cw_preview_theme", JSON.stringify(it)); window.open("/?preview=theme", "_blank"); }}>
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)} data-testid={`edit-${it.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDelId(it.id)} data-testid={`delete-${it.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? `Add ${cfg.singular}` : `Edit ${cfg.singular}`}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {cfg.fields.map((f) => <FieldRenderer key={f.name} field={f} value={form[f.name]} onChange={setField} />)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} data-testid="resource-save-btn">{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this {cfg.singular.toLowerCase()}?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={del} data-testid="confirm-delete-btn" className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!batchView} onOpenChange={(o) => !o && setBatchView(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {batchView && (
            <>
              <DialogHeader><DialogTitle>Students — {batchView.name}</DialogTitle></DialogHeader>
              <div className="mb-3 flex gap-3 text-sm">
                <span className="rounded-lg bg-secondary/60 px-3 py-1">Total seats: <strong>{batchView.capacity}</strong></span>
                <span className="rounded-lg bg-secondary/60 px-3 py-1">Occupied: <strong>{batchView.occupied}</strong></span>
                <span className="rounded-lg bg-secondary/60 px-3 py-1">Available: <strong>{batchView.available}</strong></span>
              </div>
              {batchView.fin && (
                <div className="mb-3 rounded-xl border border-border p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-heading font-semibold">Batch Financial Summary</p>
                    <Button size="sm" variant="outline" onClick={() => downloadExcel(batchView.id)} data-testid="batch-excel-btn">Download Excel</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 sm:grid-cols-3">
                    <span>Expected: <strong>₹{(batchView.fin.expected || 0).toLocaleString("en-IN")}</strong></span>
                    <span>Online: <strong>₹{(batchView.fin.online || 0).toLocaleString("en-IN")}</strong></span>
                    <span>Offline: <strong>₹{(batchView.fin.offline || 0).toLocaleString("en-IN")}</strong></span>
                    <span>Collected: <strong className="text-green-600">₹{(batchView.fin.total_collection || 0).toLocaleString("en-IN")}</strong></span>
                    <span>Pending: <strong className="text-amber-600">₹{(batchView.fin.pending_collection || 0).toLocaleString("en-IN")}</strong></span>
                    <span>Expenses: <strong>₹{(batchView.fin.expenses_total || 0).toLocaleString("en-IN")}</strong></span>
                    <span className="col-span-2 sm:col-span-1">Net Profit: <strong className="text-primary">₹{(batchView.fin.net_profit || 0).toLocaleString("en-IN")}</strong> ({batchView.fin.profit_margin}%)</span>
                  </div>
                </div>
              )}
              {batchView.fin && (
                <div className="mb-3 rounded-xl border border-border p-3 text-sm" data-testid="batch-expenses">
                  <p className="mb-2 font-heading font-semibold">Expenses</p>
                  {(batchView.fin.expenses || []).length > 0 ? (
                    <div className="mb-3 divide-y divide-border">
                      {batchView.fin.expenses.map((e) => (
                        <div key={e.id} className="flex items-center justify-between py-1.5" data-testid={`expense-${e.id}`}>
                          <div className="min-w-0"><span className="font-medium">{e.category || "General"}</span>{e.description ? <span className="ml-1 text-xs text-muted-foreground">— {e.description}</span> : null}{e.expense_date ? <span className="ml-1 text-xs text-muted-foreground">({e.expense_date})</span> : null}</div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-medium">₹{Number(e.amount || 0).toLocaleString("en-IN")}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delExpense(e.id, batchView.id)} data-testid={`del-expense-${e.id}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mb-3 text-xs text-muted-foreground">No expenses recorded yet.</p>}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Input placeholder="Category" value={expForm.category} onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))} data-testid="expense-category" />
                    <Input placeholder="Description" value={expForm.description} onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} data-testid="expense-description" />
                    <Input type="number" placeholder="Amount ₹" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} data-testid="expense-amount" />
                    <Input type="date" value={expForm.expense_date} onChange={(e) => setExpForm((p) => ({ ...p, expense_date: e.target.value }))} data-testid="expense-date" />
                  </div>
                  <Button size="sm" className="mt-2" onClick={() => addExpense(batchView.id)} data-testid="add-expense-btn"><Plus className="mr-1 h-3.5 w-3.5" /> Add Expense</Button>
                </div>
              )}
              {(!batchView.students || batchView.students.length === 0) ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No students enrolled in this batch yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {batchView.students.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5" data-testid={`batch-student-${s.id}`}>
                      {s.photo_url ? <img src={mediaUrl(s.photo_url)} alt={s.full_name} className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{(s.full_name || "?").charAt(0)}</span>}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{s.full_name} <span className="font-mono text-xs text-muted-foreground">{s.student_id}</span></p>
                        <p className="text-xs text-muted-foreground">{s.mobile} · {s.email || "—"}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{s.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
