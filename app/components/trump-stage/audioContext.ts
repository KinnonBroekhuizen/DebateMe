"use client";

/**
 * Shared Web Audio context for the Trump stage.
 *
 * Browser autoplay policy: an AudioContext only leaves the "suspended" state
 * when `resume()` is called during a user gesture. The `/debate` pipeline is
 * slow (TTS, then lip-sync polling), so by the time audio comes back the Send
 * click's activation window has closed and a fresh `resume()` stalls — which
 * is why the mouth-flap used to need a manual "Replay" click.
 *
 * So we resume the context *synchronously on the Send gesture* via
 * `unlockAudio()` and reuse it everywhere. Once running it stays running for
 * the page's lifetime, so later playback needs no new gesture.
 */

let ctx: AudioContext | null = null;

function getOrCreate(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Call inside a user gesture (the Send click) to unlock audio playback. */
export function unlockAudio(): void {
  const c = getOrCreate();
  if (c && c.state === "suspended") void c.resume();
}

/** The shared context, already running if `unlockAudio()` ran on Send. */
export function getAudioContext(): AudioContext | null {
  return getOrCreate();
}
