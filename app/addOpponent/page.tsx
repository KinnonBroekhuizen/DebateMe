"use client";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function addOpponent() {
  const [nameInput, setNameInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  return (
    <main>
      <div className="h-sreen-200">
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-6xl font-extrabold text-[var(--text)] leading-tight mb-6">
            Add a new opponent
          </h2>
          <p className="text-xl text-[var(--muted)] mb-16 max-w-xl leading-relaxed">
            Fill in all the required fields, make sure the video and photo fit
            the requirements
          </p>
        </div>
        <div className="flex">
          <p className="px-3 py-2">Opponent Name:</p>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type here"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </div>
        <div className="flex">
          <p className="px-3 py-2">Opponent Video:</p>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type here"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
          />
        </div>
        <div className="flex">
          <p className="px-3 py-2">Opponent Photo:</p>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type here"
            value={photoInput}
            onChange={(e) => setPhotoInput(e.target.value)}
          />
        </div>
      </div>
    </main>
  );
}
