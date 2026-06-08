'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

type WaveformProps = {
  stream?: MediaStream | null;
  active?: boolean;
  className?: string;
};

function drawIdle(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  const bars = 28;
  const gap = 4;
  const barWidth = Math.max(3, Math.floor((width - gap * (bars + 1)) / bars));
  const centerY = height / 2;

  for (let index = 0; index < bars; index += 1) {
    const seed = Math.sin(index * 1.3) * 0.5 + 0.5;
    const barHeight = 10 + seed * (height * 0.45);
    const x = gap + index * (barWidth + gap);
    const y = centerY - barHeight / 2;
    ctx.fillStyle = index % 2 === 0 ? '#93c5fd' : '#c7d2fe';
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

export function Waveform({ stream, active = false, className }: WaveformProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
    };

    resize();

    if (!stream) {
      drawIdle(canvas);
      return () => {};
    }

    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      drawIdle(canvas);
      return () => {};
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      source.disconnect();
      audioContext.close().catch(() => {});
      return () => {};
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrame = 0;

    const render = () => {
      resize();
      analyser.getByteFrequencyData(dataArray);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const bars = Math.min(24, bufferLength);
      const gap = 4 * (window.devicePixelRatio || 1);
      const barWidth = Math.max(3, Math.floor((width - gap * (bars + 1)) / bars));
      const maxHeight = height * 0.85;

      for (let index = 0; index < bars; index += 1) {
        const value = dataArray[index] ?? 0;
        const ratio = value / 255;
        const barHeight = Math.max(height * 0.12, ratio * maxHeight);
        const x = gap + index * (barWidth + gap);
        const y = (height - barHeight) / 2;
        ctx.fillStyle = active ? '#2563eb' : '#60a5fa';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      audioContext.close().catch(() => {});
    };
  }, [active, stream]);

  return (
    <div className={cn('relative h-24 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-slate-50', className)}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}
