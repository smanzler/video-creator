import { run } from "../../../lib/run.ts";

export type CutClipOptions = {
  videoPath: string;
  start: number;
  duration: number;
  outputPath: string;
  videoFilters?: string[];
  workDir: string;
};

/**
 * Cuts one window and writes it again with H.264 and AAC.
 * ffmpeg runs in `workDir`, so a filter can name a file there without an escape of the path.
 */
export const cutClip = async ({
  videoPath,
  start,
  duration,
  outputPath,
  videoFilters = [],
  workDir,
}: CutClipOptions): Promise<string> => {
  const filterArgs = videoFilters.length > 0 ? ["-vf", videoFilters.join(",")] : [];

  await run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      start.toFixed(3),
      "-i",
      videoPath,
      "-t",
      duration.toFixed(3),
      ...filterArgs,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { cwd: workDir },
  );

  return outputPath;
};
