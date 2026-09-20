#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { clusterMarks } from "./features/comments/lib/clusterMarks.ts";
import { collectMarks } from "./features/comments/lib/parseTimestamps.ts";
import { fetchComments } from "./features/comments/lib/fetchComments.ts";
import { createClips } from "./features/clips/lib/createClips.ts";
import { planClips } from "./features/clips/lib/planClips.ts";
import { fetchSubtitles, readCaptionFile } from "./features/subtitles/lib/fetchSubtitles.ts";
import type { Cue } from "./features/subtitles/lib/parseCaptions.ts";
import { isSubtitleMode, subtitleModes } from "./features/subtitles/lib/subtitleModes.ts";
import { downloadVideo } from "./features/video/lib/downloadVideo.ts";
import { fetchDuration } from "./features/video/lib/videoDuration.ts";
import { parseVideoId } from "./features/video/lib/videoId.ts";
import { requireCommands } from "./lib/run.ts";
import { formatTimecode } from "./lib/time.ts";

const DEFAULT_STYLE =
  "FontName=DejaVu Sans,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H90000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=40";

const options = {
  url: { type: "string" },
  "api-key": { type: "string" },
  count: { type: "string", default: "5" },
  duration: { type: "string", default: "60" },
  lead: { type: "string", default: "0" },
  window: { type: "string", default: "10" },
  "min-mentions": { type: "string", default: "1" },
  comments: { type: "string", default: "500" },
  out: { type: "string", default: "clips" },
  work: { type: "string", default: ".cache" },
  subtitles: { type: "string", default: "burn" },
  "subtitle-file": { type: "string" },
  language: { type: "string", default: "en" },
  quality: { type: "string", default: "1080" },
  style: { type: "string", default: DEFAULT_STYLE },
  "dry-run": { type: "boolean", default: false },
  help: { type: "boolean", default: false },
} as const;

/** parseArgs fills every default, so each option that has one always holds a value. */
type CliValues = {
  url?: string;
  "api-key"?: string;
  count: string;
  duration: string;
  lead: string;
  window: string;
  "min-mentions": string;
  comments: string;
  out: string;
  work: string;
  subtitles: string;
  "subtitle-file"?: string;
  language: string;
  quality: string;
  style: string;
  "dry-run": boolean;
  help: boolean;
};

const usage = `
Cut clips from a YouTube video at the moments its comments point to.

  yt-clips <url> [options]

Options
  --api-key <key>       YouTube Data API key (or set YOUTUBE_API_KEY)
  --count <n>           How many clips to cut            (default 5)
  --duration <s>        Length of one clip in seconds    (default 60)
  --lead <s>            Seconds kept before a timestamp  (default 0)
  --window <s>          Gap that still counts as the same moment (default 10)
  --min-mentions <n>    Smallest number of comments for a moment (default 1)
  --comments <n>        How many comments to read        (default 500)
  --out <dir>           Where the clips go               (default clips)
  --work <dir>          Where the video and captions stay (default .cache)
  --subtitles <mode>    ${subtitleModes.join(" | ")}     (default burn)
  --subtitle-file <f>   Use this .srt or .vtt file, and do not download captions
  --language <code>     Caption language                 (default en)
  --quality <height>    Largest video height             (default 1080)
  --style <ass>         force_style for the burnt subtitles
  --dry-run             Show the moments, download nothing
`;

const number = (value: string, name: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`--${name} needs a number, got ${value}`);
  return parsed;
};

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({ options, allowPositionals: true });
  const cli = values as CliValues;
  if (cli.help) {
    console.log(usage);
    return;
  }

  const target = cli.url ?? positionals[0];
  if (!target) throw new Error(`No video given.\n${usage}`);

  const apiKey = cli["api-key"] ?? process.env["YOUTUBE_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "No YouTube Data API key. Pass --api-key or set YOUTUBE_API_KEY. Make one at https://console.cloud.google.com/apis/credentials with the YouTube Data API v3 on.",
    );
  }

  if (!isSubtitleMode(cli.subtitles)) {
    throw new Error(`--subtitles must be one of: ${subtitleModes.join(", ")}`);
  }
  const subtitleMode = cli.subtitles;

  await requireCommands(cli["dry-run"] ? ["yt-dlp"] : ["yt-dlp", "ffmpeg", "ffprobe"]);

  const videoId = parseVideoId(target);
  const outputDir = path.resolve(cli.out);
  const workDir = path.resolve(cli.work);
  await mkdir(workDir, { recursive: true });

  console.log(`video ${videoId}`);
  const videoDuration = await fetchDuration(videoId);
  console.log(`length ${formatTimecode(videoDuration)}`);

  const comments = await fetchComments({ videoId, apiKey, limit: number(cli.comments, "comments") });
  const marks = collectMarks(comments, { maxSeconds: videoDuration });
  const clusters = clusterMarks(marks, { windowSeconds: number(cli.window, "window") });
  console.log(`comments ${comments.length}, timestamps ${marks.length}, moments ${clusters.length}`);

  const clips = planClips(clusters, {
    count: number(cli.count, "count"),
    lead: number(cli.lead, "lead"),
    duration: number(cli.duration, "duration"),
    minMentions: number(cli["min-mentions"], "min-mentions"),
    videoDuration,
  });

  if (clips.length === 0) {
    console.log("No moment matched. Read more comments with --comments, or lower --min-mentions.");
    return;
  }

  for (const clip of clips) {
    console.log(
      `  ${formatTimecode(clip.start)} -> ${formatTimecode(clip.end)}  ${clip.mentions} mentions, ${clip.likes} likes`,
    );
  }
  if (cli["dry-run"]) return;

  await mkdir(outputDir, { recursive: true });

  const videoPath = await downloadVideo({ videoId, workDir, quality: cli.quality });

  let cues: Cue[] = [];
  if (subtitleMode !== "none") {
    cues = cli["subtitle-file"]
      ? await readCaptionFile(path.resolve(cli["subtitle-file"]))
      : await fetchSubtitles({ videoId, workDir, language: cli.language });
    if (cues.length === 0) console.log(`No ${cli.language} captions found; the clips get no subtitles.`);
  }

  const made = await createClips({
    clips,
    videoPath,
    videoId,
    cues,
    outputDir,
    workDir,
    subtitleMode,
    subtitleStyle: cli.style,
    onClip: (clip) => console.log(`  wrote ${path.relative(process.cwd(), clip.outputPath)} (${clip.cueCount} cues)`),
  });

  console.log(`${made.length} clips in ${path.relative(process.cwd(), outputDir) || "."}`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
