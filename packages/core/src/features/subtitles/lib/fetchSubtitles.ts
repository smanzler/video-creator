import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { run } from "../../../lib/run.ts";
import { type Cue, formatOf, parseCaptions } from "./parseCaptions.ts";

export const readCaptionFile = async (filePath: string): Promise<Cue[]> => {
  const body = await readFile(filePath, "utf8");
  return parseCaptions(body, formatOf(filePath));
};

export type FetchSubtitlesOptions = {
  videoId: string;
  workDir: string;
  language?: string;
};

/**
 * Gets the captions of the video, and falls back to the automatic ones.
 * Gives an empty list when the video has no captions in this language.
 */
export const fetchSubtitles = async ({ videoId, workDir, language = "en" }: FetchSubtitlesOptions): Promise<Cue[]> => {
  await run("yt-dlp", [
    "--no-playlist",
    "--skip-download",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    `${language}.*,${language}`,
    "--sub-format",
    "vtt",
    "-o",
    path.join(workDir, videoId),
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  const files = (await readdir(workDir))
    .filter((name) => name.startsWith(`${videoId}.`) && name.endsWith(".vtt"))
    .sort();
  const file = files.find((name) => !name.includes("-orig")) ?? files[0];
  if (!file) return [];

  return readCaptionFile(path.join(workDir, file));
};
