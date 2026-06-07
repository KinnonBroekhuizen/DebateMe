"use client";
import { useMouthFlap, type MouthFrame } from "./useMouthFlap";

// ── Add new politicians here ──────────────────────────────────────────────────
// Only list politicians that actually have the 4 frame images shipped in
// /public/<politician>/. Anyone NOT listed here falls back to their static
// Supabase image_link (see PoliticianStage below) instead of a broken image.
// Keys are matched loosely against opponent_name (substring, case-insensitive).
const POLITICIAN_FRAMES: Record<string, {
  closed: string;
  slight: string;
  half:   string;
  open:   string;
}> = {
  trump: {
    closed: "/trump/mouth-closed.webp",
    slight: "/trump/mouth-slight.webp",
    half:   "/trump/mouth-half.webp",
    open:   "/trump/mouth-open.webp",
  },
  hipkins: {
    closed: "/hipkins/mouth-closed.webp",
    slight: "/hipkins/mouth-slight.webp",
    half:   "/hipkins/mouth-half.webp",
    open:   "/hipkins/mouth-open.webp",
  },
};

type Frames = (typeof POLITICIAN_FRAMES)[string];

// opponent_name is free-form user input, so match loosely (substring) the same
// way the backend's askAI aliases do — "Donald Trump", "Trump", "@trump" all
// resolve to the trump frames, "Chris Hipkins"/"Chippy" to hipkins, etc.
// Returns null when no shipped frame set matches, so the caller can fall back
// to the opponent's static image instead of showing the wrong politician.
function resolveFrames(opponentName: string): Frames | null {
  const name = opponentName.toLowerCase().trim().replace(/^@/, "");
  const match = Object.keys(POLITICIAN_FRAMES).find((k) => name.includes(k));
  if (match) return POLITICIAN_FRAMES[match];
  if (name.includes("chippy")) return POLITICIAN_FRAMES.hipkins;
  return null;
}

interface PoliticianStageProps {
  /** The opponent name from Supabase — used to pick the right frame set */
  opponentName: string;
  /** Static profile image (Supabase image_link). Fallback when this opponent
   *  has no animated frame set so we never render a broken image. */
  imageUrl?: string | null;
  /** Finished lip-sync video (Sync.so). Highest fidelity when present. */
  videoUrl?: string | null;
  /** base64 MP3 from the pipeline. Drives the mouth-flap fallback. */
  audioBase64?: string | null;
}

export default function PoliticianStage({
  opponentName,
  imageUrl,
  videoUrl,
  audioBase64,
}: PoliticianStageProps) {
  const { frame, playing, play } = useMouthFlap(audioBase64);

  // null when this opponent has no shipped frame set (e.g. Luxon, custom adds)
  const frames = resolveFrames(opponentName);

  // Highest fidelity: real lip-sync video.
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

  // No animated frames for this opponent → show their static image so the
  // stage isn't empty/broken. Audio (if any) still plays via the Replay button.
  if (!frames) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={opponentName}
            src={imageUrl}
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <span className="text-white/60 text-2xl font-semibold">
            {opponentName || "Opponent"}
          </span>
        )}
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

  // Render all 4 frames stacked and just toggle which one is visible. Every
  // frame is in the DOM from the start, so the browser fetches + decodes each
  // PNG ONCE up front; switching mouth positions is then a compositor-only
  // opacity flip — no mid-animation fetch/decode, which is what made the
  // old src-swapping approach stutter.
  const FRAME_ORDER: MouthFrame[] = ["closed", "slight", "half", "open"];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {FRAME_ORDER.map((f) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={f}
          alt={opponentName}
          src={frames[f]}
          aria-hidden={f !== frame}
          className={`absolute inset-0 w-full h-full object-contain select-none ${
            f === frame ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      ))}
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
