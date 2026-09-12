import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader } from "@/components/site/SiteLayout";
import { ImageUpload } from "./AdminShared";
import { api, formatApiError } from "@/lib/api";
import { TechRow, ANIM_STYLES, HOVER_EFFECTS } from "@/components/site/TechShowcase";

const DAYS = [
  { value: "everyday", label: "Everyday" },
  { value: "monday", label: "Monday" }, { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" }, { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" }, { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];
const PRES_DEFAULTS = { tech_style: "Float", tech_speed: 5, tech_direction: "left", tech_delay: 150, tech_loop: true, tech_hover: "3d-tilt" };
const EMPTY = { name: "", svg_icon: "", icon_url: "", color: "#2563EB", day_theme: "everyday", description: "", active: true };

function RowIcon({ t }) {
  const [err, setErr] = useState(false);
  if (t.icon_url && !err) return <img src={t.icon_url} alt="" onError={() => setErr(true)} className="h-8 w-8 shrink-0 object-contain" />;
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-bold text-white" style={{ background: t.color || "#2563EB" }}>{(t.name || "?")[0]}</span>;
}

export default function Technologies() {
  const [list, setList] = useState(null);
  const [pres, setPres] = useState(PRES_DEFAULTS);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [t, s] = await Promise.all([api.get("/admin/data/technologies"), api.get("/settings")]);
      setList(t.data);
      setPres({ ...PRES_DEFAULTS, ...Object.fromEntries(Object.keys(PRES_DEFAULTS).filter((k) => s.data[k] !== undefined && s.data[k] !== null).map((k) => [k, s.data[k]])) });
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  useEffect(() => { load(); }, []);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setP = (k, v) => setPres((p) => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialog(true); };
  const openEdit = (t) => { setForm({ ...EMPTY, ...t }); setEditing(t.id); setDialog(true); };

  const saveTech = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    try {
      const body = { ...form };
      if (editing) await api.put(`/admin/data/technologies/${editing}`, body);
      else await api.post("/admin/data/technologies", { ...body, sort_order: (list?.length || 0) });
      toast.success(editing ? "Technology updated" : "Technology added");
      setDialog(false); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const toggleActive = async (t) => {
    await api.put(`/admin/data/technologies/${t.id}`, { active: !t.active });
    load();
  };
  const del = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    await api.delete(`/admin/data/technologies/${t.id}`); load();
  };
  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[idx], b = list[j];
    await Promise.all([
      api.put(`/admin/data/technologies/${a.id}`, { sort_order: (b.sort_order ?? j) }),
      api.put(`/admin/data/technologies/${b.id}`, { sort_order: (a.sort_order ?? idx) }),
    ]);
    load();
  };

  const savePresentation = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", {
        tech_style: pres.tech_style, tech_speed: Number(pres.tech_speed), tech_direction: pres.tech_direction,
        tech_delay: Number(pres.tech_delay), tech_loop: !!pres.tech_loop, tech_hover: pres.tech_hover,
      });
      toast.success("Presentation settings saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  if (!list) return <Loader />;
  const activeTechs = list.filter((t) => t.active);
  const speed = Math.min(Math.max(Number(pres.tech_speed) || 5, 1), 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Technologies We Teach</h1>
          <p className="text-sm text-muted-foreground">Manage the homepage technology cards, their daily theme and card animation.</p>
        </div>
        <Button onClick={openAdd} data-testid="tech-add-btn"><Plus className="mr-1 h-4 w-4" /> Add Technology</Button>
      </div>

      {/* LIST */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No technologies yet. Add your first one.</p>
        ) : list.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 border-b border-border p-3 last:border-b-0" data-testid={`tech-row-${t.id}`}>
            <div className="flex flex-col">
              <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} data-testid={`tech-up-${t.id}`}><ArrowUp className="h-4 w-4" /></button>
              <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === list.length - 1} data-testid={`tech-down-${t.id}`}><ArrowDown className="h-4 w-4" /></button>
            </div>
            {t.icon_url ? <RowIcon t={t} /> : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-bold text-white" style={{ background: t.color || "#2563EB" }}>{(t.name || "?")[0]}</span>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{t.day_theme || "everyday"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!t.active} onCheckedChange={() => toggleActive(t)} data-testid={`tech-active-${t.id}`} />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)} data-testid={`tech-edit-${t.id}`}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del(t)} data-testid={`tech-del-${t.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* PRESENTATION */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Card Presentation</h2>
        <p className="mb-5 text-sm text-muted-foreground">Applies to the whole showcase on the homepage.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="mb-1.5 block">Animation Style</Label>
            <Select value={pres.tech_style} onValueChange={(v) => setP("tech_style", v)}>
              <SelectTrigger data-testid="pres-style"><SelectValue /></SelectTrigger>
              <SelectContent>{ANIM_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Animation Speed — {speed}/10</Label>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Slow</span>
              <Slider min={1} max={10} step={1} value={[speed]} onValueChange={(v) => setP("tech_speed", v[0])} className="flex-1" data-testid="pres-speed" />
              <span>Fast</span>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Direction (Slide / Carousel)</Label>
            <Select value={pres.tech_direction} onValueChange={(v) => setP("tech_direction", v)}>
              <SelectTrigger data-testid="pres-direction"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="left">Left → Right</SelectItem><SelectItem value="right">Right → Left</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Delay Between Cards (ms)</Label>
            <Input type="number" value={pres.tech_delay} onChange={(e) => setP("tech_delay", e.target.value)} data-testid="pres-delay" />
          </div>
          <div>
            <Label className="mb-1.5 block">Hover Effect</Label>
            <Select value={pres.tech_hover} onValueChange={(v) => setP("tech_hover", v)}>
              <SelectTrigger data-testid="pres-hover"><SelectValue /></SelectTrigger>
              <SelectContent>{HOVER_EFFECTS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div><p className="text-sm font-medium">Loop</p><p className="text-xs text-muted-foreground">Repeat animation continuously.</p></div>
            <Switch checked={pres.tech_loop !== false} onCheckedChange={(v) => setP("tech_loop", v)} data-testid="pres-loop" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setPreviewKey((k) => k + 1)} data-testid="pres-preview-btn"><Play className="mr-1 h-4 w-4" /> Preview Animation</Button>
          <Button onClick={savePresentation} disabled={saving} data-testid="pres-save-btn"><Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}</Button>
        </div>

        {/* PREVIEW */}
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-5" data-testid="tech-preview">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Preview</p>
          {activeTechs.length ? (
            <div key={previewKey}><TechRow technologies={activeTechs} presentation={pres} /></div>
          ) : <p className="text-sm text-muted-foreground">Activate at least one technology to preview.</p>}
        </div>
      </div>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Technology" : "Add Technology"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="mb-1.5 block">Name</Label><Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Kubernetes" data-testid="tech-form-name" /></div>
            <div>
              <Label className="mb-1.5 block">Daily Theme</Label>
              <Select value={form.day_theme} onValueChange={(v) => setF("day_theme", v)}>
                <SelectTrigger data-testid="tech-form-day"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">"Everyday" always shows; day-specific ones appear on that weekday. Day names are never shown to visitors.</p>
            </div>
            <div>
              <Label className="mb-1.5 block">Icon Image / SVG URL</Label>
              <ImageUpload value={form.icon_url} onChange={(v) => setF("icon_url", v)} testid="tech-form-iconurl" />
              <Input className="mt-2" value={form.icon_url} onChange={(e) => setF("icon_url", e.target.value)} placeholder="…or paste an image/SVG URL" data-testid="tech-form-iconurl-text" />
            </div>
            <div><Label className="mb-1.5 block">Inline SVG (optional, overrides image)</Label><Textarea rows={3} value={form.svg_icon} onChange={(e) => setF("svg_icon", e.target.value)} placeholder="<svg …>…</svg>" data-testid="tech-form-svg" /></div>
            <div className="flex items-center gap-3">
              <div className="flex-1"><Label className="mb-1.5 block">Accent Color</Label><div className="flex items-center gap-2"><input type="color" value={form.color || "#2563EB"} onChange={(e) => setF("color", e.target.value)} className="h-9 w-12 rounded border border-border" data-testid="tech-form-color" /><Input value={form.color} onChange={(e) => setF("color", e.target.value)} /></div></div>
            </div>
            <div><Label className="mb-1.5 block">Description (optional)</Label><Textarea rows={2} value={form.description} onChange={(e) => setF("description", e.target.value)} data-testid="tech-form-desc" /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Active</p>
              <Switch checked={!!form.active} onCheckedChange={(v) => setF("active", v)} data-testid="tech-form-active" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={saveTech} data-testid="tech-form-save">{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
