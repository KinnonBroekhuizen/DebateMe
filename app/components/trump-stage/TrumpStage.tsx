"use client";
import { useMouthFlap } from "./useMouthFlap";

interface TrumpStageProps {
  /** Finished lip-sync video (Sync.so). Highest fidelity when present. */
  videoUrl?: string | null;
  /** base64 MP3 from the pipeline. Drives the mouth-flap fallback. */
  audioBase64?: string | null;
}

/**
 * Right-hand stage. Degrades cleanly:
 *   videoUrl  -> real lip-sync video
 *   audio     -> Cooper mouth-flap PNGs driven by the TTS audio
 *   neither   -> static closed-mouth image
 */
export default function TrumpStage({ videoUrl, audioBase64 }: TrumpStageProps) {
  const { mouthOpen, playing, play } = useMouthFlap(audioBase64);

  if (videoUrl) {
    return (
      <video
        key={videoUrl}
        className="w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        playsInline
      />
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Donald Trump"
        src={mouthOpen ? "/trump/mouth-open.png" : "/trump/mouth-closed.png"}
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
      {audioBase64 && !playing && (
        <button
          onClick={play}
          className="absolute bottom-4 right-4 bg-white/90 text-black text-sm font-semibold px-4 py-2 rounded-lg shadow hover:bg-white transition"
        >
          ▶ Replay
        </button>
      )}
    </div>
  );
}
