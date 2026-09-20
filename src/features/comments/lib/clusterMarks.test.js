import assert from "node:assert/strict";
import test from "node:test";

import { clusterMarks } from "./clusterMarks.js";

test("groups nearby marks and counts them", () => {
  const marks = [
    { seconds: 100, likeCount: 1 },
    { seconds: 104, likeCount: 2 },
    { seconds: 400, likeCount: 9 },
  ];
  assert.deepEqual(clusterMarks(marks, { windowSeconds: 10 }), [
    { seconds: 100, mentions: 2, likes: 3 },
    { seconds: 400, mentions: 1, likes: 9 },
  ]);
});

test("keeps marks that are far apart separate", () => {
  const marks = [
    { seconds: 100, likeCount: 0 },
    { seconds: 130, likeCount: 0 },
  ];
  assert.equal(clusterMarks(marks, { windowSeconds: 10 }).length, 2);
});
