import path from "node:path";

import type { Cue } from "../../subtitles/lib/parseCaptions.ts";
import { sliceCues } from "../../subtitles/lib/sliceCues.ts";
import { type SubtitleMode, applySubtitles } from "../../subtitles/lib/subtitleModes.ts";
import { cutClip } from "./cutClip.ts";
import type { Clip } from "./planClips.ts";

export type CreatedClip = Clip & {
  outputPath: string;
  cueCount: number;
  files: string[];
};

export type CreateClipsOptions = {
  clips: Clip[];
  videoPath: string;
  videoId: string;
  cues: Cue[];
  outputDir: string;
  workDir: string;
  subtitleMode: SubtitleMode;
  subtitleStyle: string;
  onClip?: (clip: CreatedClip, index: number) => void;
};

const pad = (value: number): string => String(value).padStart(2, "0");

export const createClips = async ({
  clips,
  videoPath,
  videoId,
  cues,
  outputDir,
  workDir,
  subtitleMode,
  subtitleStyle,
  onClip = () => {},
}: CreateClipsOptions): Promise<CreatedClip[]> => {
  const made: CreatedClip[] = [];

  for (const [index, clip] of clips.entries()) {
    const clipName = `${videoId}-${pad(index + 1)}-${clip.label}`;
    const outputPath = path.join(outputDir, `${clipName}.mp4`);
    const clipCues = sliceCues(cues, { start: clip.start, end: clip.end });

    const { videoFilters, files } = await applySubtitles(subtitleMode, {
      cues: clipCues,
      workDir,
      clipName,
      outputPath,
      style: subtitleStyle,
    });

    await cutClip({
      videoPath,
      start: clip.start,
      duration: clip.duration,
      outputPath,
      videoFilters,
      workDir,
    });

    const result: CreatedClip = { ...clip, outputPath, cueCount: clipCues.length, files };
    made.push(result);
    onClip(result, index);
  }

  return made;
};
