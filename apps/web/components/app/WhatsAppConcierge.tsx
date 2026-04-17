"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  body: string;
  attachmentName?: string;
  attachmentSize?: string;
  createdAt: string;
}

// Session key scoped to this browser session (would be patient phone in production)
const SESSION_KEY = typeof window !== "undefined"
  ? (sessionStorage.getItem("concierge_session") ?? (() => {
      const k = `web-${Date.now()}`;
      sessionStorage.setItem("concierge_session", k);
      return k;
    })())
  : "web-demo";

// Simple keyword-based bot response (production would call an AI/WhatsApp API)
function botReply(userMsg: string): string {
  const msg = userMsg.toLowerCase();
  if (msg.includes("report") || msg.includes("result") || msg.includes("lft") || msg.includes("cbc")) {
    return "Your lab results have been finalized. You can download the signed report from the Documents section in your patient portal.";
  }
  if (msg.includes("appoint") || msg.includes("book") || msg.includes("schedule")) {
    return "To book an appointment, please visit the OPD Booking section or call our front desk. Would you like me to check available slots?";
  }
  if (msg.includes("bill") || msg.includes("payment") || msg.includes("invoice")) {
    return "Your current bill is available in the Billing section. You can pay online via UPI, card, or NEFT. Need the exact amount?";
  }
  if (msg.includes("discharge") || msg.includes("bed") || msg.includes("room")) {
    return "Your ward details and discharge summary will be shared by your care team. Is there anything specific you need from the nursing station?";
  }
  if (msg.includes("medicine") || msg.includes("prescription") || msg.includes("drug")) {
    return "Your prescription has been sent to the pharmacy. It will be ready for collection at the pharmacy counter within 30 minutes.";
  }
  return "Thank you for your message. Our care team has been notified and will respond shortly. For emergencies, please call our helpline.";
}

export default function WhatsAppConcierge() {
  const supabase  = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const [loading, setLoading]     = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("concierge_messages")
      .select("id, sender, body, attachment_name, attachment_size, created_at")
      .eq("session_key", SESSION_KEY)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      const msgs = (data as Record<string, unknown>[]).map((r) => ({
        id:             r.id as string,
        sender:         r.sender as "user" | "bot",
        body:           r.body as string,
        attachmentName: r.attachment_name as string | undefined,
        attachmentSize: r.attachment_size as string | undefined,
        createdAt:      r.created_at as string,
      }));
      setMessages(msgs);

      // Insert welcome message if first visit
      if (msgs.length === 0) {
        insertMessage("bot", "Namaste 🙏 Welcome to Ayura Hospital AI Concierge. How can I help you today?");
      }
    }
    setLoading(false);
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  const insertMessage = async (
    sender: "user" | "bot",
    body: string,
    opts?: { attachmentName?: string; attachmentSize?: string }
  ) => {
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("id")
      .limit(1)
      .single();

    if (!tenantRow) return;

    await supabase.from("concierge_messages").insert({
      tenant_id:       (tenantRow as { id: string }).id,
      session_key:     SESSION_KEY,
      sender,
      body,
      attachment_name: opts?.attachmentName ?? null,
      attachment_size: opts?.attachmentSize ?? null,
    });
  };

  useEffect(() => {
    fetchMessages();

    const ch = supabase
      .channel("concierge-stream")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "concierge_messages",
          filter: `session_key=eq.${SESSION_KEY}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          setMessages((prev) => [...prev, {
            id:             r.id as string,
            sender:         r.sender as "user" | "bot",
            body:           r.body as string,
            attachmentName: r.attachment_name as string | undefined,
            attachmentSize: r.attachment_size as string | undefined,
            createdAt:      r.created_at as string,
          }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fetchMessages, supabase]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const text = inputText.trim();
    setInputText("");
    setIsTyping(true);

    await insertMessage("user", text);

    // Simulate bot thinking delay then reply
    setTimeout(async () => {
      const reply = botReply(text);
      await insertMessage("bot", reply);
      setIsTyping(false);
    }, 1800);
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-[800px] flex items-center justify-center p-8 bg-slate-100">
      <div className="w-[380px] h-[780px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-8 border-slate-800">
        <div className="w-full h-full bg-[#E5DDD5] rounded-[2.2rem] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="bg-[#0F766E] text-white p-4 flex items-center gap-3 shadow-md z-10">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h3 className="font-bold text-[15px]">Ayura Hospital AI</h3>
              <p className="text-xs text-emerald-100 opacity-90 tracking-wide font-medium">
                {isTyping ? "typing…" : "Verified Healthcare Bot · Online"}
              </p>
            </div>
          </div>

          {/* Chat canvas */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ backgroundImage: "radial-gradient(circle at center, #d7cfc5 0%, #e5ddd5 100%)" }}
          >
            <div className="bg-[#E1F3FB] text-[#4A5568] text-xs font-bold px-3 py-1.5 rounded-lg mx-auto w-max mb-4 opacity-80 shadow-sm">
              TODAY
            </div>

            {loading && (
              <div className="text-center text-[12px] text-slate-500 font-sans">Loading…</div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow text-[14px] leading-relaxed relative
                    ${msg.sender === "user"
                      ? "bg-[#DCF8C6] text-slate-800 rounded-tr-sm"
                      : "bg-white text-slate-800 rounded-tl-sm"
                    }`}
                >
                  <p className="pb-4">{msg.body}</p>
                  {msg.attachmentName && (
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 mb-2">
                      <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded flex items-center justify-center shrink-0 text-lg font-bold">
                        PDF
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-sm text-slate-700 truncate">{msg.attachmentName}</p>
                        <p className="text-xs text-slate-500 uppercase">{msg.attachmentSize} · PDF</p>
                      </div>
                    </div>
                  )}
                  <span className={`text-[10px] absolute bottom-1.5 right-2 ${
                    msg.sender === "user" ? "text-emerald-700/80" : "text-slate-400"
                  }`}>
                    {fmtTime(msg.createdAt)}
                    {msg.sender === "user" && (
                      <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="bg-[#f0f0f0] p-2 px-3 flex items-center gap-2"
          >
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1 shadow-sm">
              <input
                className="flex-1 border-none outline-none text-[15px] bg-transparent text-slate-800 placeholder:text-slate-400"
                placeholder="Message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="w-11 h-11 bg-[#00A884] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:bg-slate-400"
            >
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
