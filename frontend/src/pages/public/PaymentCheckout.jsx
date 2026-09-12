import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CreditCard, CheckCircle2, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, formatApiError } from "@/lib/api";

export default function PaymentCheckout() {
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const [order, setOrder] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | processing | success | failed | error
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!ref) { setState("error"); setMsg("Missing order reference."); return; }
    api.get(`/payment/order/${ref}`).then((r) => {
      setOrder(r.data);
      setState(r.data.status === "success" ? "success" : "ready");
    }).catch((e) => { setState("error"); setMsg(formatApiError(e.response?.data?.detail)); });
  }, [ref]);

  const pay = async (result) => {
    setState("processing");
    try {
      const { data } = await api.post("/payment/verify", { order_ref: ref, sandbox_result: result });
      setState(data.status === "success" ? "success" : "failed");
    } catch (e) { setState("error"); setMsg(formatApiError(e.response?.data?.detail)); }
  };

  const amountStr = order ? (order.currency === "USD" ? `$${order.amount}` : `₹${Number(order.amount || 0).toLocaleString("en-IN")}`) : "";

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900 p-4" data-testid="payment-checkout">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <CreditCard className="h-5 w-5" />
          <span className="font-heading text-lg font-bold">CloudPay Secure Checkout</span>
        </div>
        <div className="p-6">
          {state === "loading" && (
            <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading order…</div>
          )}

          {state === "error" && (
            <div className="py-10 text-center">
              <XCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
              <p className="font-medium text-slate-700">{msg || "Something went wrong."}</p>
              <Link to="/courses"><Button className="mt-4 rounded-full" variant="outline">Back to Courses</Button></Link>
            </div>
          )}

          {(state === "ready" || state === "processing") && order && (
            <>
              {order.sandbox && (
                <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700" data-testid="sandbox-notice">
                  Sandbox / Test mode — no real money is charged. This simulates a full CloudPay transaction end-to-end.
                </div>
              )}
              <p className="text-xs text-slate-500">Order Reference</p>
              <p className="font-mono text-sm text-slate-800">{order.order_ref}</p>
              <p className="mt-3 text-xs text-slate-500">Course</p>
              <p className="font-medium text-slate-800">{order.course_name}</p>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-600">Amount payable</span>
                <span className="text-2xl font-bold text-slate-900" data-testid="checkout-amount">{amountStr}</span>
              </div>
              <Button className="mt-5 w-full rounded-full bg-blue-600 hover:bg-blue-700" disabled={state === "processing"} onClick={() => pay("success")} data-testid="checkout-pay-btn">
                {state === "processing" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : <>Pay {amountStr}</>}
              </Button>
              {order.sandbox && (
                <Button variant="ghost" className="mt-2 w-full text-slate-500" disabled={state === "processing"} onClick={() => pay("fail")} data-testid="checkout-fail-btn">Simulate Failed Payment</Button>
              )}
              <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Secured by CloudPay</p>
            </>
          )}

          {state === "success" && (
            <div className="py-6 text-center" data-testid="checkout-success">
              <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-500" />
              <p className="font-heading text-xl font-bold text-slate-800">Payment Successful!</p>
              <p className="mt-1 text-sm text-slate-500">You're enrolled{order?.course_name ? ` in ${order.course_name}` : ""}. Our team will reach out with your batch details shortly.</p>
              <Link to="/"><Button className="mt-5 rounded-full">Go to Homepage</Button></Link>
            </div>
          )}

          {state === "failed" && (
            <div className="py-6 text-center" data-testid="checkout-failed">
              <XCircle className="mx-auto mb-3 h-14 w-14 text-red-500" />
              <p className="font-heading text-xl font-bold text-slate-800">Payment Not Completed</p>
              <p className="mt-1 text-sm text-slate-500">Your payment was not successful. You can try again.</p>
              <Button className="mt-5 rounded-full" onClick={() => setState("ready")} data-testid="checkout-retry-btn">Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
