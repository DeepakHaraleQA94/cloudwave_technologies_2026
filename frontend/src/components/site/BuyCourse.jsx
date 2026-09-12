import React, { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError, formatINR } from "@/lib/api";
import { toast } from "sonner";

export default function BuyCourse({ course }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("INR");
  const [form, setForm] = useState({ name: "", email: "", mobile: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const price = cur === "USD" ? course.price_usd : (course.discounted_fee || course.fee);

  const pay = async () => {
    if (!form.name || !form.email || !form.mobile) { toast.error("Please fill all fields"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/payment/create-order", { course_id: course.id, currency: cur, ...form });
      if (data.checkout_url) { window.location.href = data.checkout_url; return; }
      toast.info(data.message || `Order ${data.order_ref} created (status: ${data.status}).`);
      setOpen(false);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Button size="lg" variant="secondary" className="rounded-full" onClick={() => setOpen(true)} data-testid="course-buy-btn">
        <ShoppingCart className="mr-1 h-4 w-4" /> Buy Now
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll & Pay — {course.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Currency</Label>
              <Select value={cur} onValueChange={setCur}>
                <SelectTrigger data-testid="buy-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹) — Indian students</SelectItem>
                  <SelectItem value="USD">USD ($) — International students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3 text-sm">Amount payable: <strong className="text-primary">{cur === "USD" ? (price ? `$${price}` : "Not set for USD") : formatINR(price)}</strong></div>
            <div><Label className="mb-1 block">Full Name</Label><Input value={form.name} onChange={set("name")} data-testid="buy-name" /></div>
            <div><Label className="mb-1 block">Email</Label><Input type="email" value={form.email} onChange={set("email")} data-testid="buy-email" /></div>
            <div><Label className="mb-1 block">Mobile</Label><Input value={form.mobile} onChange={set("mobile")} data-testid="buy-mobile" /></div>
            <Button className="w-full rounded-full" disabled={busy} onClick={pay} data-testid="buy-pay-btn">{busy ? "Processing..." : "Proceed to Pay"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
