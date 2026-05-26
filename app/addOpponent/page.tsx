"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Video, Image, HelpCircle } from "react-feather";

export default function AddOpponent() {
  const [nameInput, setNameInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  const [infoInput, setInfoInput] = useState("");

  const fields = [
    {
      label: "Opponent Name",
      placeholder: "e.g. John Key",
      value: nameInput,
      onChange: setNameInput,
      icon: <User color="var(--text)" size={30} />,
    },
    {
      label: "Video URL",
      placeholder: "https://youtube.com/...",
      value: videoInput,
      onChange: setVideoInput,
      icon: <Video color="var(--text)" size={30} />,
    },
    {
      label: "Photo URL",
      placeholder: "https://example.com/photo.jpg",
      value: photoInput,
      onChange: setPhotoInput,
      icon: <Image color="var(--text)" size={30} />,
    },
  ];

  return (
    <main className="min-h-screen bg-bg flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-[var(--text)]leading-tight mb-3">
            Add A New Opponent
          </h1>
          <p className="text-[var(--muted)] text-xl leading-relaxed">
            Fill in all the required fields. Make sure the video and photo URLs
            are publicly accessible.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--surface)] rounded-2xl p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            {fields.map(({ label, placeholder, value, onChange, icon }) => (
              <div key={label}>
                <label className="text-md font-semibold flex items-center gap-2 py-3">
                  <span>{icon}</span>
                  {label}
                </label>
                <input
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-md text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              </div>
            ))}

            {/* Add additional information field */}
            <div>
              <label className="text-md font-semibold flex items-center gap-2 py-3">
                <HelpCircle color="var(--text)" size={30} />
                Additional Information About Opponent
              </label>
              <textarea
                className="w-full h-36 bg-bg border border-border rounded-lg px-4 py-2.5 text-md text-[var(--text)] resize-none placeholder:text-[var(--muted)]  outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="e.g. Political party, political leaning, etc. The more detail you provide, the more accurately the AI can replicate them."
                value={infoInput}
                onChange={(e) => setInfoInput(e.target.value)}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="text-sm text-muted hover:text-[var(--text)]transition cursor-pointer"
              onClick={() => {
                setNameInput("");
                setVideoInput("");
                setPhotoInput("");
                setInfoInput("");
              }}
            >
              Clear all
            </button>
            <button
              type="button"
              className="bg-[var(--accent)] hover:bg-accent/90 text-[var(--text)] cursor-pointer text-sm font-semibold px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90"
            >
              Add Opponent
            </button>
          </div>
        </div>
      </div>
    </main>
  );
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
