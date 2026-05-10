"use client";
import Link from 'next/link';
import GetTextInput from "../getTextInput";
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

type Message = {
    id: string;
    role: "opponent" | "user";
    text: string;
};
export default function Chat(){

    const { id } = useParams();
    
    const [opponentName, setOpponentName] = useState<string>("");
    useEffect(() => {
        const fetchData = async () => {
        const resolvedId = Array.isArray(id) ? id[0] : id;
        const { data, error } = await supabase
            .from("ChatIdentifiers")
            .select("*")
            .eq("id", resolvedId)
            .maybeSingle();
            if (error) console.error(error);
            if (data) setOpponentName(data.opponent_name);
        };

        fetchData();
    }, [id]);
    //const [messages, setMessages] = useState<Message[]>([]);
    const [messages, setMessages] = useState<Message[]>([
  {
    id: "1",
    role: "user",
    text: "Hello Christopher, I reckon school uniforms are outdated and kids should be able to wear whatever they want. Can we ban them nationwide?",
  },
  {
    id: "2",
    role: "opponent",
    text: "Hi, I appreciate the message but uniforms provide fairness. No designer clothes so no bullying over what kids wear.",
  },
  {
    id: "3",
    role: "user",
    text: "But uniforms cost parents hundreds of dollars anyway.",
  },
  {
    id: "4",
    role: "opponent",
    text: "Fair point on cost, which is why we have encouraged schools to have second-hand uniform schemes.",
  },
  {
    id: "5",
    role: "user",
    text: "Kids should be able to express themselves through clothing. Uniforms suppress individuality and creativity.",
  },
  {
    id: "6",
    role: "opponent",
    text: "Self-expression is important, but there are plenty of ways to express yourself outside of school hours.",
  },
]);
    const [input, setInput] = useState("");
    const video = useRef<HTMLVideoElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (video.current) {
            video.current.src = "/api/video-stream"; // your backend endpoint
        }
    }, []);
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            text: input,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        const contextString = messages
            .map((m) => `${m.role}: ${m.text}`)
            .join(". ");
        const res = await fetch("http://localhost:8000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: input, character: opponentName, context: contextString }),
        });
        const answer = await res.json();

        const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "opponent",
        text: answer.reply,
        };
        setMessages((prev) => [...prev, aiMsg]);
    };

    return(
        <main>

            <div id="mainContainer" className='flex h-screen-200' >
                <div id="chatContainer" className='flex-1 overflow-hidden'>
                    <div className="px-4 py-3 border-b border-gray-200 shrink-0">
                        <p className="font-bold text-xl text-center">{opponentName}</p>
                    </div>

                    <div className="overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
                        <div className="flex-1" />
                        {messages.map((msg) =>
                            msg.role === "opponent" ? (
                                /* AI message — left aligned */
                                <div key={msg.id} className="flex items-start gap-2 max-w-[80%]">
                                    <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700 text-center">
                                        {opponentName}
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
                            )
                        )}
                        <div ref={bottomRef} />
                    </div>
                    <div className="flex sticky bottom-0 px-4 py-3 border-t border-gray-200 gap-2 z-10 shrink-0" style={{ backgroundColor: "#f9f8f6" }}>
                            <input
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Type here"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition shrink-0"
                            >
                            Send
                            </button>
                        </div>
                </div>
                <div className='flex-1 bg-black'>
                    <video
                        ref={video}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                </div>
            </div>
           

        </main>
    )
}