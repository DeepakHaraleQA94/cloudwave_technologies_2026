import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Cloud, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const { login, user, ready } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login"); // login | forgot

  if (ready && user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") { await login(email, password); nav("/admin"); }
      else { await api.post("/auth/forgot-password", { email }); toast.success("If the email exists, a reset link has been generated (check server logs)."); setMode("login"); }
    } catch (e2) { setErr(formatApiError(e2.response?.data?.detail) || "Login failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Cloud className="h-6 w-6" /></span><span className="font-heading text-lg font-bold">CloudWave Admin</span></div>
        <h1 className="mt-6 font-heading text-2xl font-bold">{mode === "login" ? "Welcome back" : "Reset password"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Sign in to manage your institute website." : "Enter your email to receive a reset link."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" /></div>
          {mode === "login" && <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" /></div>}
          {err && <p className="text-sm text-destructive" data-testid="login-error">{err}</p>}
          <Button type="submit" className="w-full rounded-full" disabled={busy} data-testid="login-submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Sign In" : "Send Reset Link"}</Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button className="text-primary hover:underline" onClick={() => setMode(mode === "login" ? "forgot" : "login")}>{mode === "login" ? "Forgot password?" : "Back to login"}</button>
          <Link to="/" className="text-muted-foreground hover:text-foreground">← Website</Link>
        </div>
      </div>
    </div>
  );
}
