import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
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
        <TabsList className="mb-4 flex-wrap">{Object.keys(GROUPS).map((g) => <TabsTrigger key={g} value={g} data-testid={`settings-tab-${g}`}>{g}</TabsTrigger>)}</TabsList>
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
      </Tabs>
    </div>
  );
}
