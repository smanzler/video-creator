import assert from "node:assert/strict";
import test from "node:test";

import { planClips } from "./planClips.ts";

const clusters = [
  { seconds: 100, mentions: 5, likes: 10 },
  { seconds: 130, mentions: 4, likes: 2 },
  { seconds: 400, mentions: 2, likes: 0 },
];

test("keeps the best window and drops the one that overlaps it", () => {
  const clips = planClips(clusters, { count: 5, duration: 60, videoDuration: 600 });
  assert.deepEqual(
    clips.map((clip) => [clip.start, clip.end]),
    [
      [100, 160],
      [400, 460],
    ],
  );
});

test("moves the start back by the lead and stops at the end of the video", () => {
  const clips = planClips([{ seconds: 30, mentions: 1, likes: 0 }], {
    lead: 5,
    duration: 60,
    videoDuration: 50,
  });
  assert.deepEqual(
    clips.map((clip) => [clip.start, clip.end, clip.label]),
    [[25, 50, "0m30s"]],
  );
});

test("honours the smallest number of mentions", () => {
  assert.equal(planClips(clusters, { minMentions: 5, videoDuration: 600, duration: 60 }).length, 1);
});
