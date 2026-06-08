"use client";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useSpeechInput } from "./useSpeechInput";
import PoliticianStage from "@/app/components/trump-stage/PoliticianStage";
import { unlockAudio } from "@/app/components/trump-stage/audioContext";
import { Mic, StopCircle, User } from "react-feather";

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

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function Chat() {
  const { id } = useParams();
  const resolvedId = Array.isArray(id) ? id[0] : id;
  const {
    text: input,
    setText: setInput,
    isListening,
    toggleListening,
  } = useSpeechInput();
  const [opponentName, setOpponentName] = useState<string>("");
  const [opponentImage, setOpponentImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("ChatIdentifiers")
        .select("*")
        .eq("id", resolvedId)
        .maybeSingle();

      if (error) console.error(error);
      if (data) {
        setOpponentName(data.opponent_name);
        setOpponentImage(data.image_link ?? null);
      }
    };
    fetchData();
  }, [resolvedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const visibleMessages: Message[] =
    messages.length > 0
      ? messages
      : [
          {
            id: "welcome",
            role: "opponent",
            text: "Let's debate! Send a message to start the conversation.",
          },
        ];

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (isListening) {
      toggleListening();
    }
    unlockAudio();
    const currentInput = input.trim();
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: currentInput,
    };
    const history = messages.map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/debate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          character: opponentName || resolvedId || "Donald Trump",
          history,
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
    <main className="flex h-[calc(100dvh-73px)]  bg-[var(--bg)] p-2 text-[var(--text)] sm:p-3 lg:overflow-hidden sm:overflow-auto ">
      {/* Main Container */}
      <div
        id="mainContainer"
        className="flex h-full w-full flex-col gap-3 min-h-0 lg:flex-row "
      >
        {/* Chat Panel */}
        <section
          id="chatContainer"
          className="flex flex-1 min-h-200 flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl shadow-black/25"
        >
          {/* Chat Header */}
          <header className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="lg:text-2xl lg:text-left font-semibold text-[var(--text-alt)] sm:text-center md:text-xl">
              You're now debating with {opponentName || "Debate"}
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
            {visibleMessages.map((msg) =>
              msg.role === "opponent" ? (
                <div
                  key={msg.id}
                  className="flex max-w-[92%] items-start gap-3 sm:max-w-[78%]"
                >
                  {/* Opponent's chat bubble */}
                  <div className="mt-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text) ]">
                    <User color="var(--icon)" size={17} />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-[var(--bg)] px-4 py-3 text-xl leading-6 text-[var(--text)] shadow-sm">
                    {msg.text}
                  </div>
                </div>
              ) : (
                // User's chat bubble
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[92%] rounded-2xl rounded-tr-md bg-[var(--bg)] px-4 py-3 text-xl leading-6 text-[var(--text)] shadow-sm sm:max-w-[74%]">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex max-w-[78%] items-start gap-3">
                <div className="mt-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text)]">
                  <User size={17} color="var(--icon)" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl text-xl italic rounded-tl-md bg-[var(--bg)] px-4 py-3 text-[var(--text)] shadow-sm transition-all duration-700 ease-in-out w-[290px]">
                  <p className="loading text-md font-extralight" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Chat Input */}
          <footer className="shrink-0 border-t border-white/10 bg-[var(--surface)] p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[var(--bg)] p-2 shadow-inner shadow-black/20">
              <textarea
                className="max-h-92 min-h-15 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-xl leading-6 text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                placeholder={`Message ${opponentName || "your opponent"}`}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start listening"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text)] transition hover:bg-white/10"
                type="button"
              >
                {isListening ? (
                  <StopCircle color="#ff6b6b" size={25} />
                ) : (
                  <Mic size={25} />
                )}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex h-10 w-25 shrink-0 items-center text-md font-semibold justify-center rounded-xl text-[var(--text)] opacity-100 transition-shadow hover:shadow-[0_8px_25px_0_var(--muted-accent)] duration-700 ease-in-out max-w-120 max-h-25 bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
                title="Send"
                type="button"
              >
                Send
              </button>
            </div>
          </footer>
        </section>

        {/* Politician Stage */}
        <aside className="flex min-h-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] shadow-2xl shadow-black/25 lg:h-full lg:w-[36%] lg:max-w-[460px] xl:w-[34%]">
          <div className="shrink-0 border-b border-white/10 px-5 py-4">
            <p className="text-md text-center font-medium text-[var(--text-alt)]">
              Video of {opponentName || resolvedId || "your opponent"}
              's response
            </p>
          </div>
          <div className="h-full min-h-0 flex-1">
            <PoliticianStage
              opponentName={opponentName || resolvedId || "trump"}
              imageUrl={opponentImage}
              videoUrl={videoUrl}
              audioBase64={audioB64}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
