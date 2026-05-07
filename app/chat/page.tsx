'use client'
import Link from 'next/link';
import GetTextInput from "./getTextInput";
import { useRef, useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase'

// export default async function Home() {
//   const {data,error} = await supabase
//   .from('TestingTable')
//   .select('*')

//   console.log(data, error)
//   return (
//     <div>
//       <main>
//         <h1>Debate Me</h1>
//         {data?.map((row) => (
//           <div key={row.id}>
//             <h2>{row.name}</h2>
//             <p>{row.content}</p>
//           </div>
//         ))}
//       </main>
//     </div>
//   );
// }

type Message = {
    id: string;
    role: "opponent" | "user";
    text: string;
};
export default function Chat(){

    
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
        // Send to your backend and get AI reply
        const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
        });
        const data = await res.json();

        const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "opponent",
        text: data.reply,
        };
        setMessages((prev) => [...prev, aiMsg]);
    };

    return(
        <main>

            <div id="mainContainer" className='flex ' >
                <div id="chatContainer" className='flex-1 flex'>
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-sm">Debate Chat</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                        {messages.map((msg) =>
                            msg.role === "opponent" ? (
                                /* AI message — left aligned */
                                <div key={msg.id} className="flex items-start gap-2 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700">
                                        Opponent
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
                        <div className="px-4 py-3 border-t border-gray-200 gap-2">
                        <input
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Type here"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
                        >
                        Send
                        </button>
                    </div>
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