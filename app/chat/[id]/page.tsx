"use client";
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

//message object, belongs to either an ooponent or the user
type Message = {
    id: string;
    role: "opponent" | "user";
    text: string;
};

//
export default function Chat(){

    const { id } = useParams();//gets the opponent ID from the page
    
    const [opponentName, setOpponentName] = useState<string>("");//gets opponent name from the database and ID
    //fethces opponent information and starting layout from the database
    useEffect(() => {
        const fetchData = async () => {    
        const resolvedId = Array.isArray(id) ? id[0] : id;//gets the first page param as the ID
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
        const [messages, setMessages] = useState<Message[]>([]);
        //temporary string of messages
    //     const [messages, setMessages] = useState<Message[]>([
    // {
    //     id: "1",
    //     role: "user",
    //     text: "Hello Christopher, I reckon school uniforms are outdated and kids should be able to wear whatever they want. Can we ban them nationwide?",
    // },
    // {
    //     id: "2",
    //     role: "opponent",
    //     text: "Hi, I appreciate the message but uniforms provide fairness. No designer clothes so no bullying over what kids wear.",
    // },
    // {
    //     id: "3",
    //     role: "user",
    //     text: "But uniforms cost parents hundreds of dollars anyway.",
    // },
    // {
    //     id: "4",
    //     role: "opponent",
    //     text: "Fair point on cost, which is why we have encouraged schools to have second-hand uniform schemes.",
    // },
    // {
    //     id: "5",
    //     role: "user",
    //     text: "Kids should be able to express themselves through clothing. Uniforms suppress individuality and creativity.",
    // },
    // {
    //     id: "6",
    //     role: "opponent",
    //     text: "Self-expression is important, but there are plenty of ways to express yourself outside of school hours.",
    // },
    // ]);
    
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const video = useRef<HTMLVideoElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    //used to add the chat scroll effect
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    //for getting video from the backend
    useEffect(() => {
        if (video.current) {
            video.current.src = "/api/video-stream"; // your backend endpoint
        }
    }, []);
    
    //sends new user message to the backend chatbot and awaits the response
    const sendMessage = async () => {
        if (!input.trim()) return;
        const currentInput = input; // save before clearing input
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            text: currentInput,
        };
        setMessages((prev) => [...prev, userMsg]);//adss user message to the chat messages
        setInput("");
        setIsLoading(true); // show loading bubble
        //joins the context of the messages into a string to be sent to the AI
        const contextString = messages
            .map((m) => `${m.role}: ${m.text}`)
            .join(". ");
        //sends the message to the back end
        const res = await fetch("http://localhost:8000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: currentInput, character: opponentName, context: contextString }),
        });
        
        const answer = await res.json();
        setIsLoading(false); // hide loading bubble
        //adds the response to the chat messages
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
            {/* Chat panel is left aligned */}
                <div id="chatContainer" className='flex-1 overflow-hidden'> 
                    <div className="px-4 py-3 border-b border-gray-200 shrink-0">
                        <p className="font-bold text-xl text-center">{opponentName}</p>
                    </div>

                    <div className="overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
                        <div className="flex-1" />
                        {messages.map((msg) =>
                            msg.role === "opponent" ? (
                                /* Opponent messages — left aligned */
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
                        {isLoading && (
                            <div className="flex items-start gap-2 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700">
                                {opponentName}
                            </div>
                            <div className="bg-gray-100 rounded-tl-sm rounded-tr-xl rounded-br-xl rounded-bl-xl px-4 py-3 flex gap-1 items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            </div>
                        )}
                        {/*Used for the scrolling chat */}
                        <div ref={bottomRef}/> 
                    </div>
                    {/*Chat input and Button */}
                    <div className="flex sticky bottom-0 px-4 py-3 border-t border-gray-200 gap-2 z-10 shrink-0" style={{ backgroundColor: "#f9f8f6" }}>
                            <input
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Type here"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            {/*sends message to the backend and adds it to the chat */}
                            <button
                                onClick={sendMessage}
                                className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition shrink-0"
                            >
                            Send
                            </button>
                        </div>
                </div>
                {/*right aligned video panel */}
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