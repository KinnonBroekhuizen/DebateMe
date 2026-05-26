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
                <label className="text-md font-semibold tracking-wider flex items-center gap-2 py-3">
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
              <label className="text-md font-semibold tracking-wider flex items-center gap-2 py-3">
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
}
