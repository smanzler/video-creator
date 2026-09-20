import path from "node:path";

import type { Cue } from "./parseCaptions.ts";
import { writeSrt } from "./writeSrt.ts";

export type SubtitleMode = "burn" | "sidecar" | "none";

/** ASS `force_style` that keeps the text readable over most video. */
export const defaultSubtitleStyle =
  "FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=40";

export type SubtitleContext = {
  cues: Cue[];
  workDir: string;
  clipName: string;
  outputPath: string;
  /** ASS `force_style` for the burnt subtitles. */
  style: string;
};

export type SubtitleResult = {
  /** ffmpeg `-vf` parts that the cut step adds. */
  videoFilters: string[];
  /** Files written beside the clip. */
  files: string[];
};

type SubtitleDispatch = { apply(context: SubtitleContext): Promise<SubtitleResult> };

const empty: SubtitleResult = { videoFilters: [], files: [] };

/** ffmpeg reads the name inside the filter graph, so a quote or a backslash needs an escape. */
const escapeFilterValue = (value: string): string => value.replace(/[\\']/g, (character) => `\\${character}`);

const burnMode: SubtitleDispatch = {
  apply: async ({ cues, workDir, clipName, style }) => {
    if (cues.length === 0) return empty;
    const file = `${clipName}.srt`;
    await writeSrt(path.join(workDir, file), cues);
    return {
      videoFilters: [`subtitles=filename='${escapeFilterValue(file)}':force_style='${escapeFilterValue(style)}'`],
      files: [],
    };
  },
} satisfies SubtitleDispatch;

const sidecarMode: SubtitleDispatch = {
  apply: async ({ cues, outputPath }) => {
    if (cues.length === 0) return empty;
    const file = outputPath.replace(/\.[^.]+$/, ".srt");
    await writeSrt(file, cues);
    return { videoFilters: [], files: [file] };
  },
} satisfies SubtitleDispatch;

const noneMode: SubtitleDispatch = {
  apply: async () => empty,
} satisfies SubtitleDispatch;

const subtitleDispatches: Record<SubtitleMode, SubtitleDispatch> = {
  burn: burnMode,
  sidecar: sidecarMode,
  none: noneMode,
};

export const subtitleModes = Object.keys(subtitleDispatches) as SubtitleMode[];

export const isSubtitleMode = (value: string): value is SubtitleMode => value in subtitleDispatches;

export const applySubtitles = (mode: SubtitleMode, context: SubtitleContext): Promise<SubtitleResult> =>
  subtitleDispatches[mode].apply(context);
