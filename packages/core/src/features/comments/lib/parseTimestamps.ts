import { toSeconds } from "../../../lib/time.ts";
import type { Comment } from "./fetchComments.ts";

export type Mark = { seconds: number; likeCount: number };

/** `m:ss` or `h:mm:ss`, not touching a longer number or a version string. */
const TIMESTAMP = /(?<![\d:.])(?:(\d{1,3}):)?([0-5]?\d):([0-5]\d)(?![\d:.])/g;

/** Gives each distinct timestamp in the text once, in seconds. */
export const parseTimestamps = (text: string): number[] => {
  const seen = new Set<number>();
  for (const match of text.matchAll(TIMESTAMP)) {
    const [, hours, minutes, seconds] = match;
    seen.add(
      toSeconds({
        hours: Number(hours ?? 0),
        minutes: Number(minutes),
        seconds: Number(seconds),
      }),
    );
  }
  return [...seen];
};

export type CollectMarksOptions = { maxSeconds?: number };

/** One mark per comment per timestamp, so one comment cannot stack the count. */
export const collectMarks = (comments: Comment[], { maxSeconds = Infinity }: CollectMarksOptions = {}): Mark[] =>
  comments
    .flatMap((comment) =>
      parseTimestamps(comment.text).map((seconds) => ({
        seconds,
        likeCount: comment.likeCount,
      })),
    )
    .filter((mark) => mark.seconds <= maxSeconds)
    .sort((left, right) => left.seconds - right.seconds);
