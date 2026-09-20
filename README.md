# video-creator

Finds the moments that a YouTube video's own comments point at, cuts a one minute
clip from each one, and puts subtitles over it.

```
yt-clips "https://www.youtube.com/watch?v=VIDEO_ID" --count 5
```

## What it does

1. Reads the comments with the YouTube Data API.
2. Takes every `m:ss` and `h:mm:ss` timestamp out of them.
3. Groups the timestamps that point at the same moment, and ranks the groups by
   how many comments name them (likes break a tie).
4. Downloads the video and its captions with `yt-dlp`.
5. Cuts the minute after each timestamp with `ffmpeg`, cuts the captions to the
   same window, moves their times back to zero, and burns them into the clip.

Clips land in `clips/` as `<videoId>-<n>-<timecode>.mp4`. The video and the
captions stay in `.cache/`, so a second run starts at the cut step.

## Before the first run

- Node 22.18 or later. Node runs the TypeScript sources itself, so the only
  build is the one that makes the `yt-clips` command.
- `yt-dlp` and `ffmpeg` (with `ffprobe`) on the PATH.
- A YouTube Data API v3 key: make one at
  <https://console.cloud.google.com/apis/credentials>, turn on "YouTube Data
  API v3", then `export YOUTUBE_API_KEY=...` or pass `--api-key`.

```sh
pnpm install       # TypeScript and the Node types, nothing the tool needs at run time
pnpm build         # writes dist/, which the yt-clips command runs
```

`pnpm dev <url> [options]` runs the same tool straight from the sources.

## Options

| Option                | Default            | What it does                                              |
| --------------------- | ------------------ | --------------------------------------------------------- |
| `--api-key <key>`     | `$YOUTUBE_API_KEY` | YouTube Data API key                                      |
| `--count <n>`         | `5`                | How many clips to cut                                     |
| `--duration <s>`      | `60`               | Length of one clip                                        |
| `--lead <s>`          | `0`                | Seconds kept before the timestamp                         |
| `--window <s>`        | `10`               | Gap that still counts as the same moment                  |
| `--min-mentions <n>`  | `1`                | Smallest number of comments for a moment                  |
| `--comments <n>`      | `500`              | How many comments to read                                 |
| `--out <dir>`         | `clips`            | Where the clips go                                        |
| `--work <dir>`        | `.cache`           | Where the video and the captions stay                     |
| `--subtitles <mode>`  | `burn`             | `burn`, `sidecar` (a `.srt` beside the clip), or `none`   |
| `--subtitle-file <f>` | —                  | Use this `.srt` or `.vtt` instead of the YouTube captions |
| `--language <code>`   | `en`               | Caption language                                          |
| `--quality <height>`  | `1080`             | Largest video height                                      |
| `--style <ass>`       | see `--help`       | `force_style` for the burnt subtitles                     |
| `--dry-run`           | off                | Show the moments, download nothing                        |

`--dry-run` costs one API call and no download:

```
$ yt-clips "https://youtu.be/VIDEO_ID" --dry-run
video VIDEO_ID
length 00:42:11
comments 500, timestamps 213, moments 96
  00:04:30 -> 00:05:30  38 mentions, 1204 likes
  00:19:02 -> 00:20:02  17 mentions, 96 likes
```

## Notes

- Clips never overlap: a lower ranked moment inside a clip that is already
  planned is dropped.
- A video with no captions in the language still gives clips, without subtitles.
- Automatic captions repeat a line while it grows; the slicer keeps the full
  line once.
- Take care with what you publish: the video stays under its own copyright.

## Layout

A pnpm workspace. The command line tool is one reader of the library, so a
script can be another.

```
apps/
  cli/src/cli.ts        # options, output; @video-creator/cli
packages/
  core/src/             # @video-creator/core
    pipeline.ts         # findMoments, renderClips
    features/
      comments/lib/     # API read, timestamp parse, grouping
      video/lib/        # id parse, download, length
      subtitles/lib/    # caption read, window slice, burn or sidecar
      clips/lib/        # plan, cut, run
    lib/                # process runner, time formats
```

A test sits beside the file it tests. `pnpm test`, `pnpm typecheck` and
`pnpm build` each run in every package.

## Using it from code

`@video-creator/core` gives the same two steps that the command line tool uses.
`findMoments` costs one API call and downloads nothing, so a caller can pick the
moments before it pays for the video.

```ts
import { findMoments, parseVideoId, renderClips } from "@video-creator/core";

const videoId = parseVideoId("https://youtu.be/VIDEO_ID");
const { clips } = await findMoments({ videoId, apiKey, count: 10 });

await renderClips({
  clips: clips.filter((clip) => clip.mentions >= 5),
  videoId,
  outputDir: "clips",
  workDir: ".cache",
  onClip: (clip) => console.log(clip.outputPath),
});
```

Every step stays exported on its own — `fetchComments`, `clusterMarks`,
`planClips`, `downloadVideo`, `fetchSubtitles`, `sliceCues`, `createClips` —
for a caller that wants to put the steps together itself.

Add such a script as its own workspace under `apps/`, with
`"@video-creator/core": "workspace:*"` in its dependencies.
