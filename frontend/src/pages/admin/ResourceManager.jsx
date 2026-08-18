import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api, formatApiError, formatINR } from "@/lib/api";
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
    </div>
  );
}
