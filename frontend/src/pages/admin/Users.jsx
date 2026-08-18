import React, { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Users() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const load = () => api.get("/admin/users").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const create = async () => {
    try { await api.post("/admin/users", form); toast.success("Admin created"); setOpen(false); setForm({ name: "", email: "", password: "" }); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const del = async (id) => {
    try { await api.delete(`/admin/users/${id}`); toast.success("Removed"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="font-heading text-2xl font-bold">Users / Admins</h1><p className="text-sm text-muted-foreground">Manage admin accounts</p></div>
        <Button onClick={() => setOpen(true)} data-testid="add-user-btn"><Plus className="mr-1 h-4 w-4" /> Add Admin</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"><ShieldCheck className="h-3 w-3" /> {u.role}</span></TableCell>
                <TableCell className="text-right">{u.email !== user?.email && <Button size="icon" variant="ghost" onClick={() => del(u.id)} data-testid={`delete-user-${u.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email" /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} data-testid="save-user-btn">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
