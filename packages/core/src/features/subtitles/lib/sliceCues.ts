import type { Cue } from "./parseCaptions.ts";

const MIN_LENGTH = 0.12;

export type CueWindow = { start: number; end: number };

/** Automatic captions repeat the last line in the next cue; keep the longest form once. */
const dropRepeats = (cues: Cue[]): Cue[] => {
  const kept: Cue[] = [];
  for (const cue of cues) {
    const previous = kept.at(-1);
    if (!previous) {
      kept.push(cue);
      continue;
    }
    if (cue.text === previous.text) {
      previous.end = Math.max(previous.end, cue.end);
      continue;
    }
    if (cue.text.startsWith(previous.text)) {
      kept[kept.length - 1] = { start: previous.start, end: cue.end, text: cue.text };
      continue;
    }
    kept.push(cue);
  }
  return kept;
};

/** Keeps the cues of one window and moves their times so the window starts at 0. */
export const sliceCues = (cues: Cue[], { start, end }: CueWindow): Cue[] =>
  dropRepeats(
    cues
      .filter((cue) => cue.end > start && cue.start < end)
      .map((cue) => ({
        start: Math.max(cue.start, start) - start,
        end: Math.min(cue.end, end) - start,
        text: cue.text,
      }))
      .filter((cue) => cue.end - cue.start >= MIN_LENGTH),
  );
