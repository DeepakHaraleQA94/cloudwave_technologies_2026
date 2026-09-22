import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LayoutDashboard, User, BookOpen, CalendarDays, Wallet, GraduationCap, FileText, Activity as ActivityIcon, Award, LogOut, Lock, Unlock, CheckCircle2, Download, ExternalLink, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { studentApi } from "@/lib/studentApi";
import { useStudent } from "@/context/StudentAuthContext";
import { useSite } from "@/context/SiteContext";
import { formatApiError, formatINR, mediaUrl, API } from "@/lib/api";

const TABS = [
  ["overview", "Overview", LayoutDashboard], ["profile", "My Profile", User],
  ["course", "Course & Batch", BookOpen], ["fees", "Fees & Payments", Wallet],
  ["learning", "My Learning", GraduationCap], ["documents", "My Documents", FileText],
  ["certificates", "My Certificates", Award], ["activity", "My Activity", ActivityIcon],
];

const payColor = { PAID: "bg-green-100 text-green-700", PARTIAL: "bg-amber-100 text-amber-700", UNPAID: "bg-red-100 text-red-700" };

export default function StudentDashboard() {
  const { logout } = useStudent();
  const { settings } = useSite();
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");
  const [dash, setDash] = useState(null);

  const loadDash = () => studentApi.get("/student/dashboard").then((r) => setDash(r.data)).catch((e) => toast.error(formatApiError(e.response?.data?.detail)));
  useEffect(() => { loadDash(); }, []);

  const doLogout = () => { logout(); nav("/student/login"); };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {settings.logo_url ? <img src={mediaUrl(settings.logo_url)} alt="" className="h-8 object-contain" /> : <GraduationCap className="h-6 w-6 text-primary" />}
          <span className="font-heading font-bold">{settings.institute_name || "CloudWave"} <span className="text-xs font-normal text-muted-foreground">Student</span></span>
        </div>
        <Button variant="outline" size="sm" onClick={doLogout} data-testid="student-logout-btn"><LogOut className="mr-1.5 h-4 w-4" /> Logout</Button>
      </header>

      <div className="mx-auto max-w-6xl gap-6 p-4 sm:p-6 lg:flex">
        <aside className="mb-4 lg:mb-0 lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)} data-testid={`student-tab-${k}`}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          {!dash ? <div className="grid h-64 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <>
              {tab === "overview" && <Overview dash={dash} />}
              {tab === "profile" && <Profile onSaved={loadDash} />}
              {tab === "course" && <CourseBatch dash={dash} />}
              {tab === "fees" && <Fees dash={dash} />}
              {tab === "learning" && <Learning onChange={loadDash} />}
              {tab === "documents" && <Documents />}
              {tab === "certificates" && <Certificates dash={dash} />}
              {tab === "activity" && <ActivityTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const Card = ({ children, className = "" }) => <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>;
const Stat = ({ label, value, testid }) => <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-heading text-lg font-bold" data-testid={testid}>{value}</p></div>;

function Overview({ dash }) {
  const f = dash.fee, a = dash.access;
  const pct = f.total_fee ? Math.round((f.paid / f.total_fee) * 100) : 0;
  return (
    <div className="space-y-5" data-testid="student-overview">
      <Card className="flex flex-wrap items-center gap-4">
        {dash.student.photo_url ? <img src={mediaUrl(dash.student.photo_url)} alt="" className="h-16 w-16 rounded-full object-cover" /> :
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><User className="h-7 w-7" /></span>}
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold">{dash.student.full_name}</h1>
          <p className="text-sm text-muted-foreground">{dash.student.student_id} · {dash.course.name || "No course"}</p>
        </div>
        <Badge className={`ml-auto ${payColor[f.payment_status]}`} data-testid="student-payment-badge">{f.payment_status} PAYMENT</Badge>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Total Course Fee" value={formatINR(f.total_fee)} /></Card>
        <Card><Stat label="Amount Paid" value={formatINR(f.paid)} testid="student-paid" /></Card>
        <Card><Stat label="Remaining" value={formatINR(f.remaining)} testid="student-remaining" /></Card>
        <Card><Stat label="Course Progress" value={`${dash.progress}%`} /></Card>
      </div>

      <Card>
        <p className="mb-2 text-sm font-medium">Payment Progress</p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{formatINR(f.paid)} / {formatINR(f.total_fee)} paid</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Videos" value={`${a.videos.granted} / ${a.videos.total}`} /></Card>
        <Card><Stat label="Notes / PDF" value={`${a.notes.granted} / ${a.notes.total}`} /></Card>
        <Card><Stat label="Audio" value={`${a.audio.granted} / ${a.audio.total}`} /></Card>
        <Card><Stat label="Learning Access" value={`${a.granted_total} / ${a.resources_total}`} /></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between">
          <div><p className="text-sm font-medium">Final Course Test</p><p className="text-xs text-muted-foreground">{dash.final_quiz.unlocked ? "Available" : "Complete required content & payment to unlock"}</p></div>
          {dash.final_quiz.unlocked ? <Badge className="bg-green-100 text-green-700"><Unlock className="mr-1 h-3 w-3" /> Unlocked</Badge> : <Badge variant="secondary"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>}
        </Card>
        <Card className="flex items-center justify-between">
          <div><p className="text-sm font-medium">Certificate</p><p className="text-xs text-muted-foreground">{dash.certificates > 0 ? "Available in My Certificates" : "Pass the Final Course Test to unlock"}</p></div>
          {dash.certificates > 0 ? <Badge className="bg-green-100 text-green-700"><Unlock className="mr-1 h-3 w-3" /> Available</Badge> : <Badge variant="secondary"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>}
        </Card>
      </div>
    </div>
  );
}

function CourseBatch({ dash }) {
  return (
    <Card data-testid="student-course">
      <h2 className="mb-4 font-heading text-lg font-bold">Course & Batch</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Course" value={dash.course.name || "—"} />
        <Stat label="Batch" value={dash.batch.label || "—"} />
        <Stat label="Trainer" value={dash.batch.trainer || "—"} />
        <Stat label="Enrollment Status" value={dash.student.status || "—"} />
        <Stat label="Start Date" value={dash.batch.start_date || "—"} />
        <Stat label="End Date" value={dash.batch.end_date || "—"} />
      </div>
    </Card>
  );
}

function Fees({ dash }) {
  const f = dash.fee;
  const [orders, setOrders] = useState([]);
  useEffect(() => { studentApi.get("/student/certificates").catch(() => {}); }, []);
  return (
    <div className="space-y-4" data-testid="student-fees">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><Stat label="Total Fee" value={formatINR(f.total_fee)} /></Card>
        <Card><Stat label="Paid" value={formatINR(f.paid)} /></Card>
        <Card><Stat label="Remaining" value={formatINR(f.remaining)} /></Card>
      </div>
      <Card className="flex items-center justify-between">
        <span className="text-sm font-medium">Payment Status</span>
        <Badge className={payColor[f.payment_status]}>{f.payment_status}</Badge>
      </Card>
      {f.remaining > 0 && <p className="text-sm text-muted-foreground">You have a pending balance of <strong>{formatINR(f.remaining)}</strong>. Contact the institute to complete your payment and unlock more content.</p>}
    </div>
  );
}

function Profile({ onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { studentApi.get("/student/profile").then((r) => setForm(r.data)); }, []);
  if (!form) return <Card><Loader2 className="h-5 w-5 animate-spin" /></Card>;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await studentApi.put("/student/profile", form);
      toast.success("Profile updated"); onSaved?.();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  const F = ({ label, k, type = "text" }) => (
    <div><Label className="mb-1 block text-xs">{label}</Label><Input type={type} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} data-testid={`profile-${k}`} /></div>
  );
  return (
    <Card data-testid="student-profile">
      <h2 className="mb-4 font-heading text-lg font-bold">My Profile</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div><Label className="mb-1 block text-xs">Student ID (locked)</Label><Input value={form.student_id || ""} disabled /></div>
        <div><Label className="mb-1 block text-xs">Email (locked)</Label><Input value={form.email || ""} disabled /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <F label="First Name" k="first_name" /><F label="Last Name" k="last_name" />
        <F label="Mobile" k="mobile" /><F label="Date of Birth" k="dob" type="date" />
        <F label="Gender" k="gender" /><F label="City" k="city" />
        <F label="State" k="state" /><F label="Country" k="country" />
        <F label="Pincode" k="pincode" />
        <div className="sm:col-span-2"><F label="Address" k="address" /></div>
      </div>
      <Button className="mt-4" onClick={save} disabled={busy} data-testid="profile-save">{busy ? "Saving…" : "Save Profile"}</Button>
    </Card>
  );
}

function Learning({ onChange }) {
  const [items, setItems] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const load = () => studentApi.get("/student/resources").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const open = async (r) => {
    try {
      const { data } = await studentApi.get(`/student/resources/${r.id}/access`);
      if (data.content_url) window.open(mediaUrl(data.content_url), "_blank");
      else toast.info(data.body || "Content opened.");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  const complete = async (r) => {
    try { await studentApi.post(`/student/resources/${r.id}/complete`); toast.success("Marked complete"); load(); onChange?.(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };
  if (!items) return <Card><Loader2 className="h-5 w-5 animate-spin" /></Card>;
  if (!items.length) return <Card data-testid="student-learning"><p className="text-sm text-muted-foreground">No learning resources have been added for your course yet.</p></Card>;
  const groups = items.reduce((acc, r) => { (acc[r.module || "General"] ||= []).push(r); return acc; }, {});
  return (
    <div className="space-y-5" data-testid="student-learning">
      {Object.entries(groups).map(([mod, list]) => (
        <Card key={mod}>
          <h3 className="mb-3 font-heading font-semibold">{mod}</h3>
          <div className="divide-y divide-border">
            {list.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5" data-testid={`student-resource-${r.id}`}>
                <div className="flex min-w-0 items-center gap-2">
                  {r.locked ? <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Unlock className="h-4 w-4 shrink-0 text-green-600" />}
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${r.locked ? "text-muted-foreground" : ""}`}>{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.resource_type}{r.locked ? ` · 🔒 ${r.lock_reason}` : (r.access.expiry_date ? ` · expires ${r.access.expiry_date}` : "")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.completed && <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>}
                  {r.locked ? <Badge variant="secondary" data-testid={`resource-locked-${r.id}`}><Lock className="mr-1 h-3 w-3" /> Locked</Badge> : r.resource_type === "Quiz" ? (
                    <Button size="sm" onClick={() => setQuizId(r.id)} data-testid={`resource-quiz-${r.id}`}>Start Test</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => open(r)} data-testid={`resource-open-${r.id}`}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Open</Button>
                      {!r.completed && <Button size="sm" variant="ghost" onClick={() => complete(r)} data-testid={`resource-complete-${r.id}`}>Mark done</Button>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <QuizModal rid={quizId} onClose={() => { setQuizId(null); load(); onChange?.(); }} />
    </div>
  );
}

function QuizModal({ rid, onClose }) {
  const [quiz, setQuiz] = useState(null);
  const [err, setErr] = useState("");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!rid) { setQuiz(null); setErr(""); setAnswers({}); setResult(null); return; }
    studentApi.get(`/student/quiz/${rid}`).then((r) => setQuiz(r.data)).catch((e) => setErr(formatApiError(e.response?.data?.detail)));
  }, [rid]);
  const submit = async () => {
    try {
      const arr = (quiz.questions || []).map((_, i) => (answers[i] ?? -1));
      const { data } = await studentApi.post(`/student/quiz/${rid}/submit`, { answers: arr });
      setResult(data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <Dialog open={!!rid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="quiz-modal">
        <DialogHeader><DialogTitle>Final Course Test</DialogTitle></DialogHeader>
        {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600" data-testid="quiz-error">{err}</p>}
        {result ? (
          <div className="py-4 text-center" data-testid="quiz-result">
            {result.passed ? <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" /> : <Lock className="mx-auto h-12 w-12 text-red-500" />}
            <p className="mt-2 font-heading text-xl font-bold">{result.passed ? "Congratulations! Course Completed" : "Not passed yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Score: {result.score}% (pass mark {result.passing_score}%). {result.passed ? "Your certificate is available under My Certificates." : `Attempts left: ${result.attempts_left}`}</p>
            <Button className="mt-4" onClick={onClose} data-testid="quiz-close">Close</Button>
          </div>
        ) : (!quiz && !err) ? <div className="grid place-items-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : quiz ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Pass mark {quiz.passing_score}% · Attempts left {quiz.attempts_left}/{quiz.max_attempts}</p>
            {(quiz.questions || []).map((q, i) => (
              <div key={i} data-testid={`quiz-q-${i}`}>
                <p className="text-sm font-medium">{i + 1}. {q.q}</p>
                <div className="mt-1 space-y-1">
                  {(q.options || []).map((op, oi) => (
                    <label key={oi} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={`q${i}`} checked={answers[i] === oi} onChange={() => setAnswers((a) => ({ ...a, [i]: oi }))} data-testid={`quiz-q-${i}-opt-${oi}`} /> {op}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button className="w-full" onClick={submit} disabled={quiz.attempts_left <= 0} data-testid="quiz-submit">Submit Test</Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Documents() {
  const [docs, setDocs] = useState(null);
  const [type, setType] = useState("Aadhaar");
  const [busy, setBusy] = useState(false);
  const load = () => studentApi.get("/student/documents").then((r) => setDocs(r.data));
  useEffect(() => { load(); }, []);
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    try { await studentApi.post(`/student/documents?doc_type=${encodeURIComponent(type)}`, fd); toast.success("Document uploaded"); load(); }
    catch (ex) { toast.error(formatApiError(ex.response?.data?.detail)); }
    finally { setBusy(false); e.target.value = ""; }
  };
  const view = async (d) => {
    try {
      const r = await studentApi.get(`/student/documents/${d.id}/file`, { responseType: "blob" });
      window.open(URL.createObjectURL(r.data), "_blank");
    } catch (ex) { toast.error(formatApiError(ex.response?.data?.detail)); }
  };
  const del = async (d) => { await studentApi.delete(`/student/documents/${d.id}`); load(); };
  return (
    <Card data-testid="student-documents">
      <h2 className="mb-4 font-heading text-lg font-bold">My Documents</h2>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm" data-testid="doc-type-select">
          {["Aadhaar", "PAN", "Resume", "Education Certificate", "Other"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" data-testid="doc-upload-label">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          <input type="file" className="hidden" onChange={upload} data-testid="doc-upload-input" />
        </label>
      </div>
      {!docs ? <Loader2 className="h-5 w-5 animate-spin" /> : docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded yet.</p> : (
        <div className="divide-y divide-border">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2.5" data-testid={`doc-${d.id}`}>
              <div><p className="text-sm font-medium">{d.doc_type}</p><p className="text-xs text-muted-foreground">{d.filename}</p></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => view(d)}><Download className="mr-1 h-3.5 w-3.5" /> View</Button>
                <Button size="sm" variant="ghost" onClick={() => del(d)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Certificates({ dash }) {
  const [certs, setCerts] = useState(null);
  useEffect(() => { studentApi.get("/student/certificates").then((r) => setCerts(r.data)); }, []);
  return (
    <Card data-testid="student-certificates">
      <h2 className="mb-4 font-heading text-lg font-bold">My Certificates</h2>
      {!certs ? <Loader2 className="h-5 w-5 animate-spin" /> : certs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No certificates yet. Your Course Completion Certificate unlocks after you pass the Final Course Test. Internship certificates are issued by the institute.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <div key={c.certificate_id || c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3" data-testid={`cert-${c.certificate_id || c.id}`}>
              <div>
                <p className="font-medium">{c.course || c.internship_role || "Certificate"}</p>
                <p className="text-xs text-muted-foreground">{c.certificate_id} · issued {c.issue_date || "—"}{c.grade ? ` · ${c.grade}` : ""}</p>
              </div>
              <a href={`${API}/certificates/${encodeURIComponent(c.certificate_id)}/download`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline"><Download className="mr-1 h-3.5 w-3.5" /> Download</Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivityTab() {
  const [acts, setActs] = useState(null);
  useEffect(() => { studentApi.get("/student/activity").then((r) => setActs(r.data)); }, []);
  return (
    <Card data-testid="student-activity">
      <h2 className="mb-4 font-heading text-lg font-bold">My Activity</h2>
      {!acts ? <Loader2 className="h-5 w-5 animate-spin" /> : acts.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
        <div className="divide-y divide-border">
          {acts.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium">{a.action}{a.detail ? <span className="ml-1 text-xs text-muted-foreground">— {a.detail}</span> : null}</span>
              <span className="text-xs text-muted-foreground">{(a.created_at || "").replace("T", " ").slice(0, 16)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
