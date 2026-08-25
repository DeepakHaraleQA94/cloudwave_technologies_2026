import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Bot } from "lucide-react";
import { api } from "@/lib/api";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! I'm the CloudWave AI assistant. Ask me about our courses, fees, batches or placements." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/assistant/chat", { message: text, history: next.slice(-8) });
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again or contact us directly." }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} data-testid="ai-chat-toggle" aria-label="AI Assistant"
        className="fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110">
        {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </button>
      {open && (
        <div data-testid="ai-chat-panel" className="fixed bottom-40 right-5 z-50 flex h-[28rem] w-[90vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <Bot className="h-5 w-5" />
            <div><p className="font-heading text-sm font-semibold">CloudWave AI Assistant</p><p className="text-[11px] opacity-80">Powered by Claude</p></div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{m.content}</div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="rounded-2xl bg-secondary px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about courses..." data-testid="ai-chat-input"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={send} disabled={busy} data-testid="ai-chat-send" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
