import { run } from "../../../lib/run.ts";

/** Reads the length from the YouTube metadata, so the plan can be made before the download. */
export const fetchDuration = async (videoId: string): Promise<number> => {
  const { stdout } = await run("yt-dlp", [
    "--no-playlist",
    "--skip-download",
    "--print",
    "%(duration)s",
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);
  const duration = Number.parseFloat(stdout.trim().split("\n").at(-1) ?? "");
  if (!Number.isFinite(duration)) throw new Error(`yt-dlp gave no duration for ${videoId}`);
  return duration;
};

export const probeDuration = async (videoPath: string): Promise<number> => {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration)) throw new Error(`ffprobe read no duration from ${videoPath}`);
  return duration;
};
