import assert from "node:assert/strict";
import test from "node:test";

import { collectMarks, parseTimestamps } from "./parseTimestamps.js";

test("reads minute and hour timestamps", () => {
  assert.deepEqual(parseTimestamps("2:30 is great"), [150]);
  assert.deepEqual(parseTimestamps("1:02:33 too"), [3753]);
  assert.deepEqual(parseTimestamps("10:00"), [600]);
});

test("keeps each timestamp of a comment once", () => {
  assert.deepEqual(parseTimestamps("2:30 and again 2:30"), [150]);
});

test("skips text that is not a timestamp", () => {
  assert.deepEqual(parseTimestamps("v1.2:30"), []);
  assert.deepEqual(parseTimestamps("ratio 3:70"), []);
  assert.deepEqual(parseTimestamps("12345:30"), []);
});

test("drops marks after the end of the video", () => {
  const comments = [{ text: "0:10 and 9:59:00", likeCount: 3 }];
  assert.deepEqual(collectMarks(comments, { maxSeconds: 600 }), [{ seconds: 10, likeCount: 3 }]);
});
