import { mkdir } from "node:fs/promises";

import { type CreatedClip, createClips } from "./features/clips/lib/createClips.ts";
import { type Clip, planClips } from "./features/clips/lib/planClips.ts";
import { clusterMarks } from "./features/comments/lib/clusterMarks.ts";
import { fetchComments } from "./features/comments/lib/fetchComments.ts";
import { collectMarks } from "./features/comments/lib/parseTimestamps.ts";
import { fetchSubtitles, readCaptionFile } from "./features/subtitles/lib/fetchSubtitles.ts";
import type { Cue } from "./features/subtitles/lib/parseCaptions.ts";
import { type SubtitleMode, defaultSubtitleStyle } from "./features/subtitles/lib/subtitleModes.ts";
import { downloadVideo } from "./features/video/lib/downloadVideo.ts";
import { fetchDuration } from "./features/video/lib/videoDuration.ts";

export type FindMomentsOptions = {
  videoId: string;
  apiKey: string;
  /** Length of the video. `fetchDuration` reads it when this is not given. */
  videoDuration?: number;
  /** How many comments to read. */
  comments?: number;
  /** Gap that still counts as the same moment. */
  windowSeconds?: number;
  count?: number;
  /** Seconds kept before the timestamp. */
  lead?: number;
  /** Length of one clip. */
  duration?: number;
  minMentions?: number;
};

export type Moments = {
  videoDuration: number;
  commentCount: number;
  markCount: number;
  clusterCount: number;
  clips: Clip[];
};

/** Reads the comments and ranks the moments. Downloads no video. */
export const findMoments = async ({
  videoId,
  apiKey,
  videoDuration,
  comments: commentLimit = 500,
  windowSeconds = 10,
  count = 5,
  lead = 0,
  duration = 60,
  minMentions = 1,
}: FindMomentsOptions): Promise<Moments> => {
  const length = videoDuration ?? (await fetchDuration(videoId));
  const comments = await fetchComments({ videoId, apiKey, limit: commentLimit });
  const marks = collectMarks(comments, { maxSeconds: length });
  const clusters = clusterMarks(marks, { windowSeconds });
  const clips = planClips(clusters, { count, lead, duration, minMentions, videoDuration: length });

  return {
    videoDuration: length,
    commentCount: comments.length,
    markCount: marks.length,
    clusterCount: clusters.length,
    clips,
  };
};

export type RenderClipsOptions = {
  clips: Clip[];
  videoId: string;
  outputDir: string;
  workDir: string;
  subtitleMode?: SubtitleMode;
  /** ASS `force_style` for the burnt subtitles. */
  subtitleStyle?: string;
  /** Read this `.srt` or `.vtt` file, and download no captions. */
  subtitleFile?: string;
  language?: string;
  /** Largest video height. */
  quality?: string;
  /** Runs once, after the captions come in. */
  onSubtitles?: (cues: Cue[]) => void;
  onClip?: (clip: CreatedClip, index: number) => void;
};

/** Gets the video and the captions, then cuts every clip. Makes both directories. */
export const renderClips = async ({
  clips,
  videoId,
  outputDir,
  workDir,
  subtitleMode = "burn",
  subtitleStyle = defaultSubtitleStyle,
  subtitleFile,
  language = "en",
  quality = "1080",
  onSubtitles = () => {},
  onClip = () => {},
}: RenderClipsOptions): Promise<CreatedClip[]> => {
  await mkdir(workDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const videoPath = await downloadVideo({ videoId, workDir, quality });

  let cues: Cue[] = [];
  if (subtitleMode !== "none") {
    cues = subtitleFile ? await readCaptionFile(subtitleFile) : await fetchSubtitles({ videoId, workDir, language });
    onSubtitles(cues);
  }

  return createClips({
    clips,
    videoPath,
    videoId,
    cues,
    outputDir,
    workDir,
    subtitleMode,
    subtitleStyle,
    onClip,
  });
};
