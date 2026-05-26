"use client";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useSpeechInput } from "./useSpeechInput";
import TrumpStage from "@/app/components/trump-stage/TrumpStage";
import { Mic, MicOff } from "react-feather";

//message object, belongs to either an ooponent or the user
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
  const { id } = useParams(); //gets the opponent ID from the page
  const resolvedId = Array.isArray(id) ? id[0] : id; //first page param as the ID
  const {
    text: input,
    setText: setInput,
    isListening,
    toggleListening,
  } = useSpeechInput();
  const [opponentName, setOpponentName] = useState<string>(""); //gets opponent name from the database and ID
  //fethces opponent information and starting layout from the database
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
  //const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // latest media from the pipeline — fed to the Trump stage on the right
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
      //question -> AI -> audio -> lip-sync video, all in one call
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
    <main>
      <div id="mainContainer" className="flex h-screen-200">
        {/* Chat panel is left aligned */}
        <div id="chatContainer" className="flex-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 shrink-0">
            <p className="font-bold text-xl text-center">
              {opponentName || "Donald Trump"}
            </p>
          </div>

          <div
            className="overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0"
            style={{ height: "calc(100vh - 200px)" }}
          >
            <div className="flex-1" />
            {messages.map((msg) =>
              msg.role === "opponent" ? (
                /* Opponent messages — left aligned */
                <div
                  key={msg.id}
                  className="flex items-start gap-2 max-w-[80%]"
                >
                  <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700 text-center">
                    {opponentName || "Trump"}
                  </div>
                  <div className="bg-gray-100 rounded-tl-sm rounded-tr-xl rounded-br-xl rounded-bl-xl px-3 py-2 text-sm text-gray-800 leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* User message — right aligned */
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-gray-700 text-white rounded-tl-xl rounded-tr-sm rounded-br-xl rounded-bl-xl px-3 py-2 text-sm max-w-[75%] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ),
            )}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700">
                  {opponentName || "Trump"}
                </div>
                <div className="bg-gray-100 rounded-tl-sm rounded-tr-xl rounded-br-xl rounded-bl-xl px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {/*Used for the scrolling chat */}
            <div ref={bottomRef} />
          </div>
          {/*Chat input and Button */}
          <div
            className="flex sticky bottom-0 px-4 py-3 border-t border-gray-200 gap-2 z-10 shrink-0"
            style={{ backgroundColor: "#f9f8f6" }}
          >
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Start listening"}
              className="text-xl px-2"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isListening ? "red" : "gray",
              }}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            {/*sends message to the backend and adds it to the chat */}
            <button
              onClick={sendMessage}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition shrink-0"
            >
              Send
            </button>
          </div>
        </div>
        {/*right aligned Trump stage: lip-sync video, else mouth-flap, else still */}
        <div className="flex-1 bg-black">
          <TrumpStage videoUrl={videoUrl} audioBase64={audioB64} />
        </div>
      </div>
    </main>
  );
}
