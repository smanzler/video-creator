import { toSeconds } from "../../../lib/time.ts";

export type CaptionFormat = "vtt" | "srt";

export type Cue = { start: number; end: number; text: string };

type CaptionParser = { parse(body: string): Cue[] };

const CLOCK = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;

const readClock = (value: string): number | undefined => {
  const match = CLOCK.exec(value);
  if (!match) return undefined;
  const [, hours, minutes, seconds, millis] = match;
  if (minutes === undefined || seconds === undefined || millis === undefined) return undefined;
  return toSeconds({
    hours: Number(hours ?? 0),
    minutes: Number(minutes),
    seconds: Number(seconds),
    millis: Number(millis.padEnd(3, "0")),
  });
};

/** Removes the word timing tags and the styling tags of automatic captions. */
const cleanText = (lines: string[]): string =>
  lines
    .join("\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

/** Both formats hold blocks that a `-->` line opens, so one reader serves them. */
const parseBlocks = (body: string): Cue[] => {
  const cues: Cue[] = [];

  for (const block of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [left, right] = (lines[timingIndex] ?? "").split("-->");
    const start = readClock(left ?? "");
    const end = readClock(right ?? "");
    if (start === undefined || end === undefined) continue;

    const text = cleanText(lines.slice(timingIndex + 1));
    if (text) cues.push({ start, end, text });
  }

  return cues.sort((first, second) => first.start - second.start);
};

const vttParser: CaptionParser = {
  parse: (body) => parseBlocks(body.replace(/^WEBVTT[^\n]*\n/, "")),
} satisfies CaptionParser;

const srtParser: CaptionParser = {
  parse: (body) => parseBlocks(body),
} satisfies CaptionParser;

const captionParsers: Record<CaptionFormat, CaptionParser> = {
  vtt: vttParser,
  srt: srtParser,
};

export const captionFormats = Object.keys(captionParsers) as CaptionFormat[];

export const isCaptionFormat = (value: string): value is CaptionFormat => value in captionParsers;

export const formatOf = (filePath: string): CaptionFormat => {
  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
  if (isCaptionFormat(extension)) return extension;
  throw new Error(`No caption reader for ${filePath}`);
};

export const parseCaptions = (body: string, format: CaptionFormat): Cue[] => captionParsers[format].parse(body);
