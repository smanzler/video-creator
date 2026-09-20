import { existsSync } from "node:fs";
import path from "node:path";

import { run } from "../../../lib/run.ts";

export type DownloadVideoOptions = {
  videoId: string;
  workDir: string;
  /** Largest video height. */
  quality?: string;
};

/** Downloads once and keeps the file, so a second run of the same video starts at the cut step. */
export const downloadVideo = async ({ videoId, workDir, quality = "1080" }: DownloadVideoOptions): Promise<string> => {
  const output = path.join(workDir, `${videoId}.mp4`);
  if (existsSync(output)) return output;

  await run("yt-dlp", [
    "--no-playlist",
    "--merge-output-format",
    "mp4",
    "-f",
    `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${quality}]/best`,
    "-o",
    output,
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  return output;
};
