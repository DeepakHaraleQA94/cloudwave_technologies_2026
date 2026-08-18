import React, { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, mediaUrl, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export function ImageUpload({ value, onChange, testid }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setBusy(false); }
  };
  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img src={mediaUrl(value)} alt="preview" className="h-24 w-24 rounded-lg border border-border object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} data-testid={testid}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="text-xs">Upload</span></>}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  );
}

export function TagInput({ value = [], onChange, testid }) {
  const str = Array.isArray(value) ? value.join(", ") : value || "";
  return (
    <Input defaultValue={str} onBlur={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
      placeholder="Comma separated" data-testid={testid} />
  );
}

export function FieldRenderer({ field, value, onChange }) {
  const t = field.type;
  const set = (v) => onChange(field.name, v);
  return (
    <div className={field.full ? "sm:col-span-2" : ""}>
      <Label className="mb-1.5 block text-sm">{field.label}</Label>
      {t === "text" && <Input value={value || ""} onChange={(e) => set(e.target.value)} data-testid={`field-${field.name}`} />}
      {t === "number" && <Input type="number" value={value ?? ""} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} data-testid={`field-${field.name}`} />}
      {t === "date" && <Input type="date" value={value || ""} onChange={(e) => set(e.target.value)} data-testid={`field-${field.name}`} />}
      {t === "textarea" && <Textarea rows={field.rows || 3} value={value || ""} onChange={(e) => set(e.target.value)} data-testid={`field-${field.name}`} />}
      {t === "switch" && <div className="flex items-center gap-2 pt-1"><Switch checked={!!value} onCheckedChange={set} data-testid={`field-${field.name}`} /><span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span></div>}
      {t === "image" && <ImageUpload value={value} onChange={set} testid={`field-${field.name}`} />}
      {t === "tags" && <TagInput value={value} onChange={set} testid={`field-${field.name}`} />}
      {t === "select" && (
        <Select value={value || ""} onValueChange={set}>
          <SelectTrigger data-testid={`field-${field.name}`}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{field.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {t === "json" && <Textarea rows={field.rows || 6} className="font-mono text-xs" value={typeof value === "string" ? value : JSON.stringify(value ?? field.default, null, 2)} onChange={(e) => set(e.target.value)} data-testid={`field-${field.name}`} />}
      {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}
