"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "./audioContext";

const FFT_SIZE = 256;
const VOICE_BAND_START = 2;
const VOICE_BAND_END = 18;
const LOUDNESS_THRESHOLD = 60; // lowered from 150 to work with 4 frames

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

interface MouthFlap {
  mouthOpen: boolean;
  mouthLevel: number; // 0-1 normalised loudness for 4-frame support
  playing: boolean;
  play: () => void;
}

export function useMouthFlap(audioBase64: string | null | undefined): MouthFlap {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [mouthLevel, setMouthLevel] = useState(0);
  const [playing, setPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setMouthOpen(false);
    setMouthLevel(0);
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
      const level = Math.min(avg / 130, 1); // normalise to 0-1
      setMouthOpen(avg > LOUDNESS_THRESHOLD);
      setMouthLevel(level);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    source.onended = () => stop();
  }, [audioBase64, stop]);

  useEffect(() => {
    if (audioBase64) play();
    return stop;
  }, [audioBase64, play, stop]);

  return { mouthOpen, mouthLevel, playing, play };
}
