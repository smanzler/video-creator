export { findMoments, renderClips } from "./pipeline.ts";
export type { FindMomentsOptions, Moments, RenderClipsOptions } from "./pipeline.ts";

export { createClips } from "./features/clips/lib/createClips.ts";
export type { CreateClipsOptions, CreatedClip } from "./features/clips/lib/createClips.ts";
export { cutClip } from "./features/clips/lib/cutClip.ts";
export type { CutClipOptions } from "./features/clips/lib/cutClip.ts";
export { planClips } from "./features/clips/lib/planClips.ts";
export type { Clip, PlanClipsOptions } from "./features/clips/lib/planClips.ts";

export { clusterMarks } from "./features/comments/lib/clusterMarks.ts";
export type { Cluster, ClusterMarksOptions } from "./features/comments/lib/clusterMarks.ts";
export { fetchComments } from "./features/comments/lib/fetchComments.ts";
export type { Comment, CommentOrder, FetchCommentsOptions } from "./features/comments/lib/fetchComments.ts";
export { collectMarks, parseTimestamps } from "./features/comments/lib/parseTimestamps.ts";
export type { CollectMarksOptions, Mark } from "./features/comments/lib/parseTimestamps.ts";

export { fetchSubtitles, readCaptionFile } from "./features/subtitles/lib/fetchSubtitles.ts";
export type { FetchSubtitlesOptions } from "./features/subtitles/lib/fetchSubtitles.ts";
export { captionFormats, formatOf, isCaptionFormat, parseCaptions } from "./features/subtitles/lib/parseCaptions.ts";
export type { CaptionFormat, Cue } from "./features/subtitles/lib/parseCaptions.ts";
export { sliceCues } from "./features/subtitles/lib/sliceCues.ts";
export type { CueWindow } from "./features/subtitles/lib/sliceCues.ts";
export {
  applySubtitles,
  defaultSubtitleStyle,
  isSubtitleMode,
  subtitleModes,
} from "./features/subtitles/lib/subtitleModes.ts";
export type { SubtitleContext, SubtitleMode, SubtitleResult } from "./features/subtitles/lib/subtitleModes.ts";
export { toSrt, writeSrt } from "./features/subtitles/lib/writeSrt.ts";

export { downloadVideo } from "./features/video/lib/downloadVideo.ts";
export type { DownloadVideoOptions } from "./features/video/lib/downloadVideo.ts";
export { fetchDuration, probeDuration } from "./features/video/lib/videoDuration.ts";
export { parseVideoId } from "./features/video/lib/videoId.ts";

export { requireCommands, run } from "./lib/run.ts";
export type { CommandResult } from "./lib/run.ts";
export { formatCompact, formatSrtTime, formatTimecode, toSeconds } from "./lib/time.ts";
export type { TimeParts } from "./lib/time.ts";
