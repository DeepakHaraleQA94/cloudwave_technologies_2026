import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

const STATUS_COLOR = { success: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", failed: "bg-red-100 text-red-700", cancelled: "bg-slate-100 text-slate-600", needs_config: "bg-blue-100 text-blue-700" };

export default function Payments() {
  const [provs, setProvs] = useState([]);
  const [orders, setOrders] = useState([]);
  const load = () => {
    api.get("/admin/payment-providers").then((r) => setProvs(r.data));
    api.get("/admin/orders").then((r) => setOrders(r.data));
  };
  useEffect(load, []);

  const save = async (p, patch) => {
    try { await api.put(`/admin/payment-providers/${p.id}`, patch); toast.success("Saved"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const collected = orders.filter((o) => o.status === "success").reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Payments & Gateways</h1>
      <p className="mb-6 text-sm text-muted-foreground">Provider-agnostic. Configure gateways below. API keys and secrets are stored securely on the server and never sent back to the browser. CloudPay runs in <strong>Sandbox (mock)</strong> mode — fully testable end-to-end — until you switch to Live with valid credentials.</p>

      <h2 className="mb-3 font-heading text-lg font-semibold">Payment Providers</h2>
      <div className="space-y-4">
        {provs.map((p) => <ProviderCard key={p.id} p={p} onSave={save} />)}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Orders</h2>
        <span className="text-sm text-muted-foreground">Verified collection: <strong className="text-primary">₹{collected.toLocaleString("en-IN")}</strong></span>
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Course</TableHead><TableHead>Amount</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No orders yet</TableCell></TableRow> :
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.order_ref}</TableCell>
                  <TableCell>{o.course_name}</TableCell>
                  <TableCell>{o.currency === "USD" ? `$${o.amount}` : `₹${(o.amount || 0).toLocaleString("en-IN")}`}</TableCell>
                  <TableCell>{o.provider}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status] || ""}`}>{o.status}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(o.created_at || "").slice(0, 10)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProviderCard({ p, onSave }) {
  const [d, setD] = useState({ base_url: p.base_url && !String(p.base_url).includes("•") ? p.base_url : (p.base_url || ""), api_key: "", secret: "", mode: p.mode === "live" ? "live" : "sandbox", priority: p.priority ?? 100 });
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const save = () => {
    const patch = { base_url: d.base_url, mode: d.mode, priority: Number(d.priority) };
    if (d.api_key) patch.api_key = d.api_key;
    if (d.secret) patch.secret = d.secret;
    onSave(p, patch);
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid={`provider-${p.id}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-base font-semibold">{p.name}</span>
          <span className="text-xs text-muted-foreground">({(p.currencies || []).join(", ")})</span>
          {p.enabled
            ? (p.sandbox ? <Badge className="bg-blue-100 text-blue-700" data-testid={`provider-status-${p.id}`}>Sandbox (mock)</Badge> : <Badge className="bg-green-100 text-green-700" data-testid={`provider-status-${p.id}`}>Live · Configured</Badge>)
            : <Badge variant="secondary" data-testid={`provider-status-${p.id}`}>Inactive</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active</span>
          <Switch checked={!!p.enabled} onCheckedChange={(v) => onSave(p, { enabled: v })} data-testid={`provider-toggle-${p.id}`} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label className="mb-1 block text-xs">Base URL</Label><Input value={d.base_url} onChange={(e) => set("base_url", e.target.value)} placeholder="https://api.cloudpay.example/v1" data-testid={`${p.id}-base-url`} /></div>
        <div><Label className="mb-1 block text-xs">Mode</Label>
          <Select value={d.mode} onValueChange={(v) => set("mode", v)}>
            <SelectTrigger data-testid={`${p.id}-mode`}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sandbox">Sandbox / Test (mock)</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="mb-1 block text-xs">API Key {p.api_key_set && <span className="text-green-600">· saved ({p.api_key})</span>}</Label><Input value={d.api_key} onChange={(e) => set("api_key", e.target.value)} placeholder={p.api_key_set ? "Enter new value to replace" : "Enter API key"} data-testid={`${p.id}-api-key`} /></div>
        <div><Label className="mb-1 block text-xs">API Secret {p.secret_set && <span className="text-green-600">· saved ({p.secret})</span>}</Label><Input type="password" value={d.secret} onChange={(e) => set("secret", e.target.value)} placeholder={p.secret_set ? "Enter new value to replace" : "Enter secret"} data-testid={`${p.id}-secret`} /></div>
        <div><Label className="mb-1 block text-xs">Priority</Label><Input type="number" value={d.priority} onChange={(e) => set("priority", e.target.value)} className="w-28" data-testid={`${p.id}-priority`} /></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={save} data-testid={`${p.id}-save`}>Save Configuration</Button>
        {d.mode === "live" && !p.secret_set && !d.secret && <span className="text-xs text-amber-600">Live mode needs valid credentials; otherwise checkout safely runs in mock mode.</span>}
      </div>
    </div>
  );
}
