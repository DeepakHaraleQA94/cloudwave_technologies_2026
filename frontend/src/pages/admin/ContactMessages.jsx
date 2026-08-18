import React, { useEffect, useState } from "react";
import { Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ContactMessages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); api.get("/admin/contact-messages").then((r) => setItems(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);
  const del = async (id) => { await api.delete(`/admin/contact-messages/${id}`); toast.success("Deleted"); load(); };
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Contact Messages</h1>
      <p className="mb-6 text-sm text-muted-foreground">{items.length} messages</p>
      <div className="space-y-4">
        {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? <p className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">No messages yet</p> :
          items.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5 shadow-sm" data-testid={`message-${m.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading font-semibold">{m.name} <span className="text-sm font-normal text-muted-foreground">· {(m.created_at || "").slice(0, 10)}</span></p>
                  <p className="text-sm text-primary"><a href={`mailto:${m.email}`}>{m.email}</a>{m.phone && ` · ${m.phone}`}</p>
                  {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => del(m.id)} data-testid={`delete-message-${m.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.message}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
