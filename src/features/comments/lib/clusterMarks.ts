import type { Mark } from "./parseTimestamps.ts";

export type Cluster = { seconds: number; mentions: number; likes: number };

export type ClusterMarksOptions = { windowSeconds?: number };

/**
 * Puts marks that point at the same moment into one group.
 * @param windowSeconds Largest gap between two marks of one group.
 */
export const clusterMarks = (marks: Mark[], { windowSeconds = 10 }: ClusterMarksOptions = {}): Cluster[] => {
  const clusters: Cluster[] = [];

  for (const mark of [...marks].sort((left, right) => left.seconds - right.seconds)) {
    const current = clusters.at(-1);
    if (current && mark.seconds - current.seconds <= windowSeconds) {
      current.mentions += 1;
      current.likes += mark.likeCount;
      continue;
    }
    clusters.push({ seconds: mark.seconds, mentions: 1, likes: mark.likeCount });
  }

  return clusters.sort(
    (left, right) => right.mentions - left.mentions || right.likes - left.likes || left.seconds - right.seconds,
  );
};
