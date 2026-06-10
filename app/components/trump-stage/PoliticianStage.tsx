"use client";
import { useEffect, useRef, useState } from "react";
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
  // .webp frames are 960x540 re-encodes (~12-40KB each) of the 1920x1080
  // source .pngs (~900KB each). The pngs choked rendering on phones/tunnels:
  // 3.6MB of frames started downloading only when the first reply landed,
  // painting top-down ("only the top quarter shows"). Regenerate with cwebp
  // if the source pngs change.
  hipkins: {
    closed: "/hipkins/mouth-closed.webp",
    slight: "/hipkins/mouth-slight.webp",
    half:   "/hipkins/mouth-half.webp",
    open:   "/hipkins/mouth-open.webp",
  },
  luxon: {
    closed: "/luxon/mouth-closed.webp",
    slight: "/luxon/mouth-slight.webp",
    half:   "/luxon/mouth-half.webp",
    open:   "/luxon/mouth-open.webp",
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
  // <video> failures (expired link, unsupported codec, network) fire onError
  // and never paint a frame — track them so we drop to the mouth-flap/static
  // fallback instead of leaving a silent black rectangle on stage.
  const [videoFailed, setVideoFailed] = useState(false);
  // Browsers refuse unmuted autoplay without a sufficiently recent user
  // gesture (always on first page load; Safari even after Send, because the
  // lip-sync response lands minutes after the click). When play() rejects we
  // ask for a tap rather than showing a paused, frameless black box.
  const [needsTap, setNeedsTap] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideoOnStage = Boolean(videoUrl) && !videoFailed;

  // The lip-sync video carries its own audio track. While it's on stage, keep
  // the mouth-flap idle (its effect auto-plays the MP3) so the two audio
  // sources don't speak over each other; if the video errors out, the MP3 is
  // handed back to the mouth-flap which then plays as the fallback.
  const { frame, playing, play } = useMouthFlap(
    isVideoOnStage ? null : audioBase64,
  );

  // A new clip must not inherit the previous clip's failed/tap state — reset
  // during render (React's "adjusting state when a prop changes" pattern).
  const [prevVideoUrl, setPrevVideoUrl] = useState(videoUrl);
  if (prevVideoUrl !== videoUrl) {
    setPrevVideoUrl(videoUrl);
    setVideoFailed(false);
    setNeedsTap(false);
  }

  useEffect(() => {
    if (!videoUrl) return;
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  }, [videoUrl]);

  const tapToPlay = () => {
    // Called from a click, so the gesture satisfies the autoplay policy.
    videoRef.current
      ?.play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  };

  // null when this opponent has no shipped frame set (custom adds)
  const frames = resolveFrames(opponentName);

  // Warm the frame images into the browser cache on mount, not at first
  // reply — otherwise the first animation races its own asset downloads and
  // the mouth visibly pops in half-rendered.
  useEffect(() => {
    if (!frames) return;
    Object.values(frames).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [frames]);

  // Highest fidelity: real lip-sync video.
  if (videoUrl && !videoFailed) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          key={videoUrl}
          className="w-full h-full object-cover"
          src={videoUrl}
          poster={imageUrl ?? undefined}
          autoPlay
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
        {needsTap && (
          <button
            onClick={tapToPlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/30"
            type="button"
          >
            <span className="bg-white/90 text-black text-sm font-semibold px-4 py-2 rounded-lg shadow">
              ▶ Play response
            </span>
          </button>
        )}
      </div>
    );
  }

  // No animated frames for this opponent → show their static image so the
  // stage isn't empty/broken. Audio (if any) still plays via the Replay button.
  if (!frames || (!audioBase64)) {
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
