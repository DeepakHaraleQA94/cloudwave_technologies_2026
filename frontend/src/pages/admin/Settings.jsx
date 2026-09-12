import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { mediaUrl } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./AdminShared";
import { useSite } from "@/context/SiteContext";
import { Loader } from "@/components/site/SiteLayout";
import { toast } from "sonner";

const F = (name, label, type = "text") => ({ name, label, type });
const GROUPS = {
  General: [F("institute_name", "Institute Name"), F("tagline", "Tagline"), F("logo_url", "Logo", "image"), F("hero_image", "Hero Image", "image"), F("footer_text", "Footer Text", "textarea"), F("theme_mode", "Theme Mode", "theme")],
  Contact: [F("phone", "Phone"), F("phone_alt", "Alternate Phone"), F("whatsapp", "WhatsApp Number (with country code)"), F("email", "Email"), F("address", "Address", "textarea"), F("maps_url", "Google Maps URL"), F("working_hours", "Working Hours")],
  Social: [F("facebook", "Facebook"), F("instagram", "Instagram"), F("linkedin", "LinkedIn"), F("youtube", "YouTube"), F("twitter", "X / Twitter"), F("youtube_channel", "YouTube Channel URL"), F("instagram_profile", "Instagram Profile URL")],
  Homepage: [F("hero_title", "Hero Title", "textarea"), F("hero_description", "Hero Description", "textarea")],
  Statistics: [F("stat_students", "Students Trained"), F("stat_courses", "Courses"), F("stat_trainers", "Trainers"), F("stat_placement", "Placement Rate (%)"), F("stat_experience", "Years of Experience")],
};

export default function Settings() {
  const { refresh } = useSite();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/settings").then((r) => setForm(r.data || {})); }, []);
  if (!form) return <Loader />;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const scale = Math.min(Math.max(Number(form.logo_scale) || 1, 0.6), 1.6);
  const fx = form.logo_effect_enabled ? (form.logo_effect || "normal") : "normal";
  const fxClass = fx === "3d" ? "logo-fx logo-effect-3d" : fx === "rotation" ? "logo-fx logo-effect-rotate" : "";

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/settings", form); toast.success("Settings saved"); refresh(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-heading text-2xl font-bold">Website Settings</h1><p className="text-sm text-muted-foreground">Manage institute info, contact, social and appearance.</p></div>
        <Button onClick={save} disabled={saving} data-testid="settings-save-btn"><Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}</Button>
      </div>
      <Tabs defaultValue="General">
        <TabsList className="mb-4 flex-wrap">{Object.keys(GROUPS).map((g) => <TabsTrigger key={g} value={g} data-testid={`settings-tab-${g}`}>{g}</TabsTrigger>)}<TabsTrigger value="Branding" data-testid="settings-tab-Branding">Branding</TabsTrigger></TabsList>
        {Object.entries(GROUPS).map(([g, fields]) => (
          <TabsContent key={g} value={g}>
            <div className="grid gap-5 rounded-xl border border-border bg-card p-6 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : ""}>
                  <Label className="mb-1.5 block">{f.label}</Label>
                  {f.type === "text" && <Input value={form[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} data-testid={`setting-${f.name}`} />}
                  {f.type === "textarea" && <Textarea rows={3} value={form[f.name] || ""} onChange={(e) => set(f.name, e.target.value)} data-testid={`setting-${f.name}`} />}
                  {f.type === "image" && <ImageUpload value={form[f.name]} onChange={(v) => set(f.name, v)} testid={`setting-${f.name}`} />}
                  {f.type === "theme" && (
                    <Select value={form.theme_mode || "auto"} onValueChange={(v) => set("theme_mode", v)}>
                      <SelectTrigger data-testid="setting-theme_mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatic (time-based)</SelectItem>
                        <SelectItem value="light">Always Light</SelectItem>
                        <SelectItem value="dark">Always Dark</SelectItem>
                        <SelectItem value="off">Disable dynamic themes</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
        <TabsContent value="Branding">
          <div className="grid gap-6 rounded-xl border border-border bg-card p-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <Label className="mb-1.5 block">Website / Application Name</Label>
                <Input value={form.institute_name || ""} onChange={(e) => set("institute_name", e.target.value)} placeholder="e.g. ABC Academy" data-testid="setting-institute_name-branding" />
                <p className="mt-1 text-xs text-muted-foreground">Shown across the header, footer and browser tab. Used for future white-labelling.</p>
              </div>
              <div>
                <Label className="mb-2 block">Logo Display Size — {Math.round(scale * 100)}%</Label>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>smaller</span>
                  <Slider min={0.6} max={1.6} step={0.05} value={[scale]} onValueChange={(v) => set("logo_scale", v[0])} className="flex-1" data-testid="setting-logo_scale" />
                  <span>larger</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Only the display size changes — your uploaded logo file is untouched.</p>
              </div>
              <div>
                <Label className="mb-1.5 block">Logo Effect</Label>
                <Select value={form.logo_effect || "normal"} onValueChange={(v) => set("logo_effect", v)}>
                  <SelectTrigger data-testid="setting-logo_effect"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="3d">3D</SelectItem>
                    <SelectItem value="rotation">Rotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><p className="text-sm font-medium">Enable Logo Effect</p><p className="text-xs text-muted-foreground">Off keeps the normal logo appearance.</p></div>
                <Switch checked={!!form.logo_effect_enabled} onCheckedChange={(v) => set("logo_effect_enabled", v)} data-testid="setting-logo_effect_enabled" />
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6" data-testid="branding-preview">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Preview</p>
              <div className="flex min-h-[140px] items-center justify-center rounded-lg bg-background p-6" style={{ perspective: "600px" }}>
                {form.logo_url ? (
                  <img src={mediaUrl(form.logo_url)} alt="Logo preview" className={`w-auto object-contain ${fxClass}`} style={{ height: `calc(3rem * ${scale})` }} data-testid="branding-preview-logo" />
                ) : (
                  <span className={`font-heading font-bold text-foreground ${fxClass}`} style={{ fontSize: `calc(1.5rem * ${scale})` }} data-testid="branding-preview-name">{form.institute_name || "CloudWave"}<span className="text-brand-accent">.</span></span>
                )}
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">Header &amp; footer will display: <span className="font-medium text-foreground">{form.institute_name || "CloudWave"}</span></p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
