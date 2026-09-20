import path from "node:path";

import { writeSrt } from "./writeSrt.js";

/** @typedef {"burn" | "sidecar" | "none"} SubtitleMode */
/**
 * @typedef {{
 *   cues: { start: number, end: number, text: string }[],
 *   workDir: string,
 *   clipName: string,
 *   outputPath: string,
 *   style: string,
 * }} SubtitleContext
 */
/** @typedef {{ apply(context: SubtitleContext): Promise<{ videoFilters: string[], files: string[] }> }} SubtitleDispatch */

const empty = { videoFilters: [], files: [] };

/** ffmpeg reads the name inside the filter graph, so a quote or a backslash needs an escape. */
const escapeFilterValue = (value) => value.replace(/[\\']/g, (character) => `\\${character}`);

/** @type {SubtitleDispatch} */
const burnMode = {
  apply: async ({ cues, workDir, clipName, style }) => {
    if (cues.length === 0) return empty;
    const file = `${clipName}.srt`;
    await writeSrt(path.join(workDir, file), cues);
    return {
      videoFilters: [`subtitles=filename='${escapeFilterValue(file)}':force_style='${escapeFilterValue(style)}'`],
      files: [],
    };
  },
};

/** @type {SubtitleDispatch} */
const sidecarMode = {
  apply: async ({ cues, outputPath }) => {
    if (cues.length === 0) return empty;
    const file = outputPath.replace(/\.[^.]+$/, ".srt");
    await writeSrt(file, cues);
    return { videoFilters: [], files: [file] };
  },
};

/** @type {SubtitleDispatch} */
const noneMode = {
  apply: async () => empty,
};

/** @type {Record<SubtitleMode, SubtitleDispatch>} */
const subtitleDispatches = {
  burn: burnMode,
  sidecar: sidecarMode,
  none: noneMode,
};

export const subtitleModes = Object.keys(subtitleDispatches);

export const applySubtitles = (mode, context) => subtitleDispatches[mode].apply(context);
