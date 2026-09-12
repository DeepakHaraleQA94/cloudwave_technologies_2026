import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <p className="mb-6 text-sm text-muted-foreground">Provider-agnostic. Configure gateways below; credentials are stored securely in server environment variables (never in the browser).</p>

      <h2 className="mb-3 font-heading text-lg font-semibold">Payment Providers</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Enabled</TableHead><TableHead>Mode</TableHead><TableHead>Priority</TableHead><TableHead>Credentials</TableHead></TableRow></TableHeader>
          <TableBody>
            {provs.map((p) => (
              <TableRow key={p.id} data-testid={`provider-${p.id}`}>
                <TableCell className="font-medium">{p.name} <span className="text-xs text-muted-foreground">({(p.currencies || []).join(", ")})</span></TableCell>
                <TableCell><Switch checked={!!p.enabled} onCheckedChange={(v) => save(p, { enabled: v })} data-testid={`provider-toggle-${p.id}`} /></TableCell>
                <TableCell>
                  <Select value={p.mode || "test"} onValueChange={(v) => save(p, { mode: v })}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="test">Test / Sandbox</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input type="number" defaultValue={p.priority} className="w-20" onBlur={(e) => save(p, { priority: Number(e.target.value) })} /></TableCell>
                <TableCell>{p.configured ? <Badge className="bg-green-100 text-green-700">Configured</Badge> : <Badge variant="secondary">Add keys in .env</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!provs.some((p) => p.configured && p.enabled) && (
        <p className="mt-2 text-xs text-muted-foreground">CloudPay activates automatically once <code>CLOUDPAY_BASE_URL</code>, <code>CLOUDPAY_API_KEY</code> and <code>CLOUDPAY_SECRET</code> are set in backend environment variables.</p>
      )}

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
