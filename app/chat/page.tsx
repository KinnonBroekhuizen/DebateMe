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


export default function Home(){
    const [messages, setMessages] = useState<Message[]>([]);
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

    return(
        <main>
            <header className="flex head-banner items-center px-6 py-4 w-full">
                    {/*Left*/}
                    <h1 className='flex-1'><Link href="../" className="no-underline hover:underline">Debate Me</Link></h1>
                    {/*Center*/}
                    <h1 className="text-center text-lg flex-1 flex justify-center">[ Chat Name]</h1>
                    {/*Right*/}
                    <div className="flex-1 flex justify-end">
                        <button className="bg-gray-500 text-white px-4 py-2 rounded">New Chat</button>
                    </div>
            </header>

            <div id="mainContainer" className='flex h-dvh' >
                <div id="chatContainer" className='flex-1 flex'>
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-sm">Debate Chat</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                        {messages.map((msg) =>
                            msg.role === "ai" ? (
                                /* AI message — left aligned */
                                <div key={msg.id} className="flex items-start gap-2 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-xs font-medium text-blue-700">
                                        AI
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
                    <GetTextInput />
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