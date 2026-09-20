import type { Cluster } from "../../comments/lib/clusterMarks.ts";
import { formatCompact } from "../../../lib/time.ts";

export type Clip = Cluster & {
  start: number;
  end: number;
  duration: number;
  /** Timecode of the moment, for the file name. */
  label: string;
};

export type PlanClipsOptions = {
  count?: number;
  /** Seconds kept before the timestamp. */
  lead?: number;
  /** Length of one clip. */
  duration?: number;
  videoDuration: number;
  minMentions?: number;
};

const overlaps = (left: Clip, right: Clip): boolean => left.start < right.end && right.start < left.end;

/** Turns the ranked clusters into clip windows that do not overlap. */
export const planClips = (
  clusters: Cluster[],
  { count = 5, lead = 0, duration = 60, videoDuration, minMentions = 1 }: PlanClipsOptions,
): Clip[] => {
  const kept: Clip[] = [];

  for (const cluster of clusters) {
    if (kept.length >= count) break;
    if (cluster.mentions < minMentions) continue;

    const start = Math.max(0, cluster.seconds - lead);
    const end = Math.min(videoDuration, start + duration);
    if (end - start < 1) continue;

    const clip: Clip = { ...cluster, start, end, duration: end - start, label: formatCompact(cluster.seconds) };
    if (kept.some((other) => overlaps(other, clip))) continue;
    kept.push(clip);
  }

  return kept.sort((left, right) => left.start - right.start);
};
