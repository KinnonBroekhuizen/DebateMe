"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "./audioContext";

// Animation math mirrors speechanimation.js from the DebateMeTest repo
// (the reference implementation): average the voice-frequency bins 2-18 of a
// 256-point FFT into one raw 0-255 loudness value, then bucket it straight
// into a mouth frame. No normalisation step — the thresholds below were
// hand-tuned against Fish Audio's output volume.
const FFT_SIZE = 256;
const VOICE_BAND_START = 2;
const VOICE_BAND_END = 18;
const CLOSED_BELOW = 80;
const SLIGHT_BELOW = 110;
const HALF_BELOW = 150;

// Loudness buckets -> which mouth frame to show. Kept here (not in the
// component) so the rAF loop can skip React re-renders unless the bucket
// actually changes — the analyser ticks ~60fps but the mouth only moves
// between 4 states, so we'd otherwise re-render ~60x/sec for nothing.
export type MouthFrame = "closed" | "slight" | "half" | "open";

function levelToFrame(avg: number): MouthFrame {
  if (avg < CLOSED_BELOW) return "closed";
  if (avg < SLIGHT_BELOW) return "slight";
  if (avg < HALF_BELOW) return "half";
  return "open";
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

interface MouthFlap {
  frame: MouthFrame; // current mouth frame; changes only on bucket transitions
  playing: boolean;
  play: () => void;
}

export function useMouthFlap(audioBase64: string | null | undefined): MouthFlap {
  const [frame, setFrame] = useState<MouthFrame>("closed");
  const [playing, setPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<MouthFrame>("closed");

  const setFrameIfChanged = useCallback((next: MouthFrame) => {
    if (next !== lastFrameRef.current) {
      lastFrameRef.current = next;
      setFrame(next);
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setFrameIfChanged("closed");
    setPlaying(false);
  }, [setFrameIfChanged]);

  const play = useCallback(async () => {
    if (!audioBase64) return;
    stop();

    // Reuse the shared context that the Send gesture already unlocked, so
    // playback starts straight away without needing a fresh "Replay" click.
    const audioCtx = audioCtxRef.current ?? getAudioContext();
    if (!audioCtx) return;
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === "suspended") await audioCtx.resume();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(
        base64ToArrayBuffer(audioBase64),
      );
    } catch {
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = FFT_SIZE;

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    source.start();
    setPlaying(true);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const band = dataArray.slice(VOICE_BAND_START, VOICE_BAND_END);
      const avg = band.reduce((a, b) => a + b, 0) / band.length;
      setFrameIfChanged(levelToFrame(avg));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    source.onended = () => stop();
  }, [audioBase64, stop, setFrameIfChanged]);

  useEffect(() => {
    if (audioBase64) play();
    return stop;
  }, [audioBase64, play, stop]);

  return { frame, playing, play };
}
