"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "./audioContext";

/**
 * Faithful React port of Cooper's `241 TTS/speechanimation.js`.
 *
 * Same algorithm as the branch code: a 256-point FFT analyser, average the
 * voice-band bins 2..18 into one loudness number, and show the open mouth
 * when that average is above 150 (closed otherwise). The only change is the
 * audio source: the `/debate` pipeline already returns base64 MP3, so we
 * decode that instead of re-fetching `/speak`.
 */

const FFT_SIZE = 256;
const VOICE_BAND_START = 2;
const VOICE_BAND_END = 18;
const LOUDNESS_THRESHOLD = 150;

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

interface MouthFlap {
  mouthOpen: boolean;
  playing: boolean;
  play: () => void;
}

export function useMouthFlap(audioBase64: string | null | undefined): MouthFlap {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setMouthOpen(false);
    setPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (!audioBase64) return;
    stop();

    const audioCtx =
      audioCtxRef.current ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === "suspended") await audioCtx.resume();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(
        base64ToArrayBuffer(audioBase64),
      );
    } catch {
      return; // undecodable audio — leave mouth closed
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
      setMouthOpen(avg > LOUDNESS_THRESHOLD);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    source.onended = () => stop();
  }, [audioBase64, stop]);

  // Auto-play whenever a new clip arrives (the Send click already satisfied
  // the browser autoplay gesture requirement).
  useEffect(() => {
    if (audioBase64) play();
    return stop;
  }, [audioBase64, play, stop]);

  return { mouthOpen, playing, play };
}
