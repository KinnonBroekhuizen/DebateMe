"use client";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import TrumpStage from "@/app/components/trump-stage/TrumpStage";
import { Send, Pause, VolumeX } from "react-feather";

type Message = {
  id: string;
  role: "opponent" | "user";
  text: string;
};

type DebateResponse = {
  reply: string;
  audio: string | null;
  videoUrl: string | null;
};

const BACKEND_URL = "http://localhost:8000";

export default function Chat() {
  const { id } = useParams();
  const resolvedId = Array.isArray(id) ? id[0] : id;

  const [opponentName, setOpponentName] = useState<string>("");
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("ChatIdentifiers")
        .select("*")
        .eq("id", resolvedId)
        .maybeSingle();
      if (error) console.error(error);
      if (data) setOpponentName(data.opponent_name);
    };
    fetchData();
  }, [resolvedId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: currentInput,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    const contextString = messages
      .map((m) => `${m.role}: ${m.text}`)
      .join(". ");

    try {
      const res = await fetch(`${BACKEND_URL}/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          character: opponentName || resolvedId || "Donald Trump",
          context: contextString,
        }),
      });
      if (!res.ok) throw new Error(`backend ${res.status}`);
      const answer: DebateResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "opponent", text: answer.reply },
      ]);
      setVideoUrl(answer.videoUrl);
      setAudioB64(answer.audio);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "opponent",
          text: "Couldn't reach the debate backend. Is it running on :8000?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border shrink-0">
        <h2 className="text-3xl font-bold text-text tracking-wide">
          {opponentName || "Chat Name"}
        </h2>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Chat */}
        <div className="flex flex-col flex-[3] min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-5">
            <div className="flex-1" />

            {messages.map((msg) =>
              msg.role === "opponent" ? (
                /* Opponent — left */
                <div key={msg.id} className="flex justify-start">
                  <div className="bg-surface border border-border text-text text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[45%] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* User — center */
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-accent/90 text-white text-sm px-4 py-3 rounded-2xl max-w-[45%] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {/* Loading bubble */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
            <input
              className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-base text-text placeholder:text-muted/50 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Type here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-border hover:bg-muted/40 transition text-text p-3 rounded-xl shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Right: Stage */}
        <div className="flex flex-col flex-[2] p-5 border-l border-border gap-3">
          {/* Video area */}
          <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden">
            <TrumpStage videoUrl={videoUrl} audioBase64={audioB64} />
          </div>

          {/* Controls */}
          <div className="flex justify-end gap-2 shrink-0">
            <button className="bg-border hover:bg-muted/30 transition text-text p-3 rounded-xl border border-border">
              <Pause size={20} />
            </button>
            <button className="bg-border hover:bg-muted/30 transition text-text p-3 rounded-xl border border-border">
              <VolumeX size={20} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
