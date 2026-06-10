"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Video, Image, Type, HelpCircle } from "react-feather";

export default function AddOpponent() {
  //Fields the user must input to add an opponent
  const [nameInput, setNameInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoInput, setPhotoInput] = useState("");
  const [infoInput, setInfoInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  const handleClick = async () => {
    //Makes sure all fields are entered
    if (
      !nameInput.trim() ||
      !infoInput.trim() ||
      !photoInput.trim() ||
      !titleInput.trim() ||
      !videoFile
    ) {
      alert("Please fill in all fields.");
      return;
    }
    //gets video upload and adds it to the database
    const fileName = `${Date.now()}_${videoFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, videoFile);
    if (uploadError) {
      alert("Error uploading video: " + uploadError.message);
      return;
    }
    //creates the link between the table and file storage in the backend
    const {
      data: { publicUrl },
    } = supabase.storage.from("videos").getPublicUrl(fileName);
    const nameArray = nameInput.split(" ");
    const idToAdd = nameArray[nameArray.length - 1];
    //uploads all fields into a new row of the database
    const { error } = await supabase.from("ChatIdentifiers").insert({
      id: idToAdd,
      opponent_name: nameInput,
      Information: infoInput,
      image_link: photoInput,
      title: titleInput,
      video_url: publicUrl,
      welcome_text: "We had a great country. We can have an even greater country. Americans want safe communities, good jobs, lower costs, and leaders who put their interests first. That's what we're fighting for. Ask me anything about our policies, our plans, and how we're going to bring back success, strength, and opportunity for every American. Thank you. It's going to be tremendous.",
      welcome_video_url: "https://fatqkpkosagzfddyyist.supabase.co/storage/v1/object/public/videos/trump_intro_video.mp4",
    });

    if (error) {
      alert("Error inserting opponent: " + error.message);
    } else {
      alert("Opponent added successfully!");
      //reset inputs
      setNameInput("");
      setInfoInput("");
      setPhotoInput("");
      setVideoFile(null);
      setTitleInput("");
    }
  };
  //input fields
  const fields = [
    {
      label: "Opponent Name",
      placeholder: "e.g. John Key",
      value: nameInput,
      onChange: setNameInput,
      icon: <User color="var(--icon)" size={30} />,
    },
    {
      label: "Opponent Title",
      placeholder: "e.g. Ex-Prime Minister with National",
      value: titleInput,
      onChange: setTitleInput,
      icon: <Type color="var(--icon)" size={30} />,
    },
    {
      label: "Photo URL",
      placeholder: "https://example.com/photo.jpg",
      value: photoInput,
      onChange: setPhotoInput,
      icon: <Image color="var(--icon)" size={30} />,
    },
  ];

  return (
    <main className="min-h-screen bg-bg flex text-[var(--text)]  items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold leading-tight mb-3">
            Add A New Opponent
          </h1>
          <p className="text-(--muted) text-xl leading-relaxed">
            Fill in all the required fields. Make sure the photo URL is publicly
            accessible and the MP4 file is around 20s of uncut, uninterrupted
            footage of your opponent talking.
          </p>
        </div>

        {/* Input Fields */}
        <div className="bg-(--surface) rounded-2xl p-8 flex flex-col gap-6 text-[var(--text-alt)]">
          <div className="flex flex-col gap-5">
            {fields.map(({ label, placeholder, value, onChange, icon }) => (
              <div key={label}>
                <label className="text-md font-semibold flex items-center gap-2 py-3">
                  <span>{icon}</span>
                  {label}
                </label>
                <input
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-md text-(--text-alt) placeholder:text-(--text-alt) outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                />
              </div>
            ))}
            {/* Video Upload Field*/}
            <div>
              <label className="text-md font-semibold flex items-center gap-2 py-3">
                <Video color="var(--icon)" size={30} />
                {/*Icon*/}
                Opponent Video
              </label>
              <div className="flex justify-between items-center gap-3">
                <input
                  type="file"
                  accept="video/mp4"
                  id="video-upload"
                  className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                <span className="text-sm text---muted) truncate">
                  {videoFile ? videoFile.name : "No file chosen"}
                </span>
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer bg-(--accent) text-(--text-alt) text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition"
                >
                  Choose File
                </label>
              </div>
            </div>
            {/* Add additional information field */}
            <div>
              <label className="text-md font-semibold flex items-center gap-2 py-3">
                <HelpCircle color="var(--icon)" size={30} />
                Additional Information About Opponent
              </label>
              <textarea
                className="w-full h-36 bg-bg border border-border rounded-lg px-4 py-2.5 text-md text-(--text-alt) resize-none placeholder:text-(--text-alt) outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
              className="text-sm text-(--text-alt) hover:text-[var(--text)]transition cursor-pointer"
              onClick={() => {
                {
                  /*Clear fields*/
                }
                setNameInput("");
                setVideoFile(null);
                setPhotoInput("");
                setInfoInput("");
                setTitleInput("");
              }}
            >
              Clear all
            </button>
            <button
              type="button"
              className="bg-(--accent) cursor-pointer text-sm font-semibold px-6 py-2.5 rounded-lg hover:shadow-[0_8px_25px_0_var(--muted-accent)] duration-700 ease-in-out delay-75"
              onClick={handleClick}
            >
              Add Opponent
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
