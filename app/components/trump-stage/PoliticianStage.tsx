"use client";
import { useMouthFlap } from "./useMouthFlap";

// ── Add new politicians here ──────────────────────────────────────────────────
// Keys must match the opponent_name stored in Supabase (case-insensitive)
// Add the 4 frame images to /public/<politician>/ folder
const POLITICIAN_FRAMES: Record<string, {
  closed: string;
  slight: string;
  half:   string;
  open:   string;
}> = {
  trump: {
    closed: "/trump/mouth-closed.png",
    slight: "/trump/mouth-slight.png",
    half:   "/trump/mouth-half.png",
    open:   "/trump/mouth-open.png",
  },
  hipkins: {
    closed: "/hipkins/mouth-closed.png",
    slight: "/hipkins/mouth-slight.png",
    half:   "/hipkins/mouth-half.png",
    open:   "/hipkins/mouth-open.png",
  },
  luxon: {
    closed: "/luxon/mouth-closed.png",
    slight: "/luxon/mouth-slight.png",
    half:   "/luxon/mouth-half.png",
    open:   "/luxon/mouth-open.png",
  },
};

// Fallback if politician not found
const DEFAULT_FRAMES = POLITICIAN_FRAMES.trump;

interface PoliticianStageProps {
  /** The opponent name from Supabase — used to pick the right images */
  opponentName: string;
  /** Finished lip-sync video (Sync.so). Highest fidelity when present. */
  videoUrl?: string | null;
  /** base64 MP3 from the pipeline. Drives the mouth-flap fallback. */
  audioBase64?: string | null;
}

export default function PoliticianStage({ opponentName, videoUrl, audioBase64 }: PoliticianStageProps) {
  const { mouthOpen, mouthLevel, playing, play } = useMouthFlap(audioBase64);

  // Match opponent name to frames — lowercase, trim whitespace
  const key = opponentName.toLowerCase().trim();
  const frames = POLITICIAN_FRAMES[key] ?? DEFAULT_FRAMES;

  // Pick the right frame based on mouth level (0-3)
  function getFrame(): string {
    if (!mouthOpen) return frames.closed;
    if (mouthLevel < 0.4) return frames.slight;
    if (mouthLevel < 0.75) return frames.half;
    return frames.open;
  }

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
        alt={opponentName}
        src={getFrame()}
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
