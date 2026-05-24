"use client";
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function addOpponent(){
    const [nameInput, setNameInput] = useState("");
    const [videoInput, setVideoInput] = useState("");
    const [photoInput, setPhotoInput] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");
    const handleClick = async () =>{
        const nameArray = nameInput.split(' ');
        const idToAdd = nameArray[nameArray.length -1];
        const { error } = await supabase
        .from("ChatIdentifiers")
        .insert({
        id: idToAdd,
        opponent_name: nameInput,
        Information: descriptionInput,
        image_link: photoInput,
        });

    if (error) {
        alert("Error inserting opponent: " + error.message);
    } else {
        alert("Opponent added successfully!");
        setNameInput("");
        setDescriptionInput("");
        setPhotoInput("");
        setVideoInput("");
    }
    }
    return(
        <main>
            <div className='h-sreen-200'>
                <div className="px-4 py-3 border-b border-gray-200 shrink-0">
                    <h2 className="text-6xl font-extrabold text-black leading-tight mb-6 animate-fade-down animate-once animate-ease-out">
                        Add a new opponent
                    </h2>
                    <p className="text-xl text-gray-700 mb-16 max-w-xl leading-relaxed animate-fade-down animate-once animate-ease-out animate-delay-500">
                        Fill in all the required fields, make sure the video and photo fit the requirements
                    </p>
                </div>
                <div className='flex'>
                    <p className='w-56 shrink-0 px-3 py-2'>Opponent Name:</p>
                    <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type here"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    />
                </div>
                <div className='flex'>
                    <p className='w-56 shrink-0 px-3 py-2'>Opponent Description/Role:</p>
                    <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type here"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    />
                </div>
                <div className='flex'>
                    <p className='w-56 shrink-0 px-3 py-2'>Opponent Video:</p>
                    <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type here"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    />
                </div>
                <div className='flex'>
                    <p className='w-56 shrink-0 px-3 py-2'>Opponent Photo Link:</p>
                    <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Type here"
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    />
                </div>
                <button className="bg-gray-300 hover:bg-gray-400 hover:cursor-pointer text-gray-700 font-semibold px-6 py-3 rounded-md transition-colors" onClick={handleClick}>
                    Add Opponent
                </button>
            </div>
        </main>
    )
}