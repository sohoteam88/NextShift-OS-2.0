import type { MasterScript } from '../types';

export const subtitleService = {
  generateSRT(script: MasterScript): string {
    let srt = '';
    let index = 1;
    for (const scene of script.scenes) {
      const [start, end] = parseTimeRange(scene.time_range);
      srt += `${index}\n`;
      srt += `${formatSRTTime(start)} --> ${formatSRTTime(end)}\n`;
      srt += `${scene.voiceover || scene.text_overlay}\n\n`;
      index += 1;
    }
    return srt.trim();
  },

  generateCaptionChunks(script: MasterScript): { time_range: string; text: string }[] {
    return script.scenes.map((scene) => ({ time_range: scene.time_range, text: scene.text_overlay }));
  },
};

function parseTimeRange(range: string): [number, number] {
  const match = range.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return [0, 3];
  return [Number(match[1]), Number(match[2])];
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)},000`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
