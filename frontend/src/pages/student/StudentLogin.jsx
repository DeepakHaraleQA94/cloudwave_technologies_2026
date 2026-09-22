import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudent } from "@/context/StudentAuthContext";
import { useSite } from "@/context/SiteContext";
import { formatApiError, mediaUrl } from "@/lib/api";

export default function StudentLogin() {
  const { login } = useStudent();
  const { settings } = useSite();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(identifier, password);
      nav("/student/dashboard");
    } catch (ex) {
      setErr(formatApiError(ex.response?.data?.detail));
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl" data-testid="student-login-card">
        <div className="mb-6 flex flex-col items-center text-center">
          {settings.logo_url ? <img src={mediaUrl(settings.logo_url)} alt="" className="h-12 object-contain" /> :
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="h-6 w-6" /></span>}
          <h1 className="mt-4 font-heading text-2xl font-bold">Student Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">{settings.institute_name || "CloudWave"} learning portal</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Student ID or Email</Label>
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="CW-2026-0001 or your email" required data-testid="student-login-identifier" />
          </div>
          <div>
            <Label className="mb-1.5 block">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required data-testid="student-login-password" />
          </div>
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" data-testid="student-login-error">{err}</p>}
          <Button type="submit" className="w-full rounded-full" disabled={busy} data-testid="student-login-submit">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Sign In
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          You can log in even if your fees are unpaid or partially paid. <Link to="/" className="text-primary underline">Back to website</Link>
        </p>
      </div>
    </div>
  );
}
