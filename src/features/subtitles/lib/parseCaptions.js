import { toSeconds } from "../../../lib/time.js";

/** @typedef {"vtt" | "srt"} CaptionFormat */
/** @typedef {{ start: number, end: number, text: string }} Cue */
/** @typedef {{ parse(body: string): Cue[] }} CaptionParser */

const CLOCK = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;

const readClock = (value) => {
  const match = CLOCK.exec(value);
  if (!match) return undefined;
  const [, hours, minutes, seconds, millis] = match;
  return toSeconds({
    hours: Number(hours ?? 0),
    minutes: Number(minutes),
    seconds: Number(seconds),
    millis: Number(millis.padEnd(3, "0")),
  });
};

/** Removes the word timing tags and the styling tags of automatic captions. */
const cleanText = (lines) =>
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
const parseBlocks = (body) => {
  const cues = [];

  for (const block of body.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [left, right] = lines[timingIndex].split("-->");
    const start = readClock(left);
    const end = readClock(right ?? "");
    if (start === undefined || end === undefined) continue;

    const text = cleanText(lines.slice(timingIndex + 1));
    if (text) cues.push({ start, end, text });
  }

  return cues.sort((first, second) => first.start - second.start);
};

/** @type {CaptionParser} */
const vttParser = {
  parse: (body) => parseBlocks(body.replace(/^WEBVTT[^\n]*\n/, "")),
};

/** @type {CaptionParser} */
const srtParser = {
  parse: (body) => parseBlocks(body),
};

/** @type {Record<CaptionFormat, CaptionParser>} */
const captionParsers = {
  vtt: vttParser,
  srt: srtParser,
};

export const captionFormats = Object.keys(captionParsers);

export const formatOf = (filePath) => {
  const extension = filePath.split(".").pop()?.toLowerCase();
  if (extension && extension in captionParsers) return /** @type {CaptionFormat} */ (extension);
  throw new Error(`No caption reader for ${filePath}`);
};

/** @param format One of `captionFormats`. */
export const parseCaptions = (body, format) => captionParsers[format].parse(body);
