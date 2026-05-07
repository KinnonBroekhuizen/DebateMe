"use client";
import { useState,  } from "react"

export default function GetTextInput(){
    const [input, setInput] = useState('')
    const sendInputString = () =>{
        console.log("Button clicked")
        console.log(input)
    }

    return(
        <div>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value) } placeholder="Enter chat" autoComplete="off"></input>
            <button onClick={sendInputString} className="cursor-pointer hover:opacity-80 active:scale-95 transition">Send</button>
        </div>
    )
}