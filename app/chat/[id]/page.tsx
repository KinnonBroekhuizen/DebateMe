"use client";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useSpeechInput } from "./useSpeechInput";
import PoliticianStage from "@/app/components/trump-stage/PoliticianStage";
import { unlockAudio } from "@/app/components/trump-stage/audioContext";
import { Mic, MicOff, Send, User } from "react-feather";

//message object, belongs to either an ooponent or the user
type Message = {
  id: string;
  role: "opponent" | "user";
  text: string;
};

//The objects the backend sends back to be displayed/outputted to user
type DebateResponse = {
  reply: string;
  audio: string | null;
  videoUrl: string | null;
};

// defaults to the local backend, but deploy2.sh overrides this with the
// backend's Cloudflare tunnel URL so remote browsers can reach it too.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function Chat() {
  const { id } = useParams(); //gets the opponent ID from the page
  const resolvedId = Array.isArray(id) ? id[0] : id; //first page param as the ID
  const {
    text: input,
    setText: setInput,
    isListening,
    toggleListening,
  } = useSpeechInput();
  const [opponentName, setOpponentName] = useState<string>(""); //gets opponent name from the database and ID
  const [opponentImage, setOpponentImage] = useState<string | null>(null); //static profile image, used when the opponent has no animated frames
  //fetches opponent information and starting layout from the database
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

  const [messages, setMessages] = useState<Message[]>([]);
  //const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // latest media from the pipeline — fed to the Trump stage on the right
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //sends user input to backend
  const sendMessage = async () => {
    if (!input.trim()) return;
    // Unlock audio *now*, while the click gesture is still active. The /debate
    // call is slow, so this is the only moment the browser will let us start
    // playback later without a manual "Replay" tap.
    unlockAudio();
    const currentInput = input;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: currentInput,
    };
    setMessages((prev) => [...prev, userMsg]); //adds message to the chat messages
    setInput("");
    setIsLoading(true);
    // prior turns (oldest-first) become the opponent's memory of the chat.
    // `messages` here is the snapshot BEFORE this question, which is exactly
    // the history we want — the current question rides in `question`.
    const history = messages.map((m) => ({ role: m.role, text: m.text }));

    try {
      //question -> AI -> audio -> lip-sync video, all in one call
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

      //adds the response to the chat messages
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "opponent", text: answer.reply },
      ]);
      // drive the stage: real video if we have it, else mouth-flap audio
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
      setIsLoading(false); // hide loading bubble
    }
  };

  return (
    <main className="h-dvh bg-[var(--bg)] px-3 py-3 text-[var(--text)] sm:px-5 sm:py-5">
      <div
        id="mainContainer"
        className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4"
      >
        <section
          id="chatContainer"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] shadow-xl shadow-black/10"
        >
          <header className="shrink-0 border-b border-[var(--border-soft)] px-4 py-3 sm:px-5">
            <p className="text-center text-lg font-semibold text-[var(--text)] sm:text-xl">
              {opponentName || "Debate"}
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="flex-1" />

            {messages.map((msg) =>
              msg.role === "opponent" ? (
                <div
                  key={msg.id}
                  className="flex max-w-[88%] items-start gap-2 sm:max-w-[78%]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-soft)]">
                    <User color="var(--icon)" size={20} />
                  </div>
                  <div className="rounded-lg rounded-tl-sm bg-[var(--surface-soft)] px-3 py-2 text-sm leading-relaxed text-[var(--text)]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[88%] rounded-lg rounded-tr-sm bg-[var(--accent)] px-3 py-2 text-sm leading-relaxed text-[var(--text-alt)] sm:max-w-[74%]">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {isLoading && (
              <div className="flex max-w-[88%] items-start gap-2 sm:max-w-[78%]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-soft)]">
                  <User color="var(--icon)" size={20} />
                </div>
                <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-[var(--surface-soft)] px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] animation-delay-none" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] animation-delay-150ms" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] animation-delay-300ms" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <footer className="shrink-0 border-t border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--bg)] px-2 py-2">
              <input
                className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                placeholder="Type here"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Start listening"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                type="button"
              >
                {isListening ? (
                  <MicOff color="red" size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--text-alt)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                title="Send"
                type="button"
              >
                <Send size={18} />
              </button>
            </div>
          </footer>
        </section>

        <aside className="min-h-[220px] shrink-0 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-black lg:h-full lg:w-[36%] lg:max-w-[460px] xl:w-[34%]">
          <div className="mx-auto h-full w-full max-w-[430px]">
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
