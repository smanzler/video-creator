import assert from "node:assert/strict";
import test from "node:test";

import { sliceCues } from "./sliceCues.js";

test("keeps the window and moves the times to zero", () => {
  const cues = [
    { start: 5, end: 9, text: "before" },
    { start: 59, end: 62, text: "edge" },
    { start: 65, end: 70, text: "inside" },
    { start: 200, end: 202, text: "after" },
  ];
  assert.deepEqual(sliceCues(cues, { start: 60, end: 120 }), [
    { start: 0, end: 2, text: "edge" },
    { start: 5, end: 10, text: "inside" },
  ]);
});

test("makes one cue of a line that grows", () => {
  const cues = [
    { start: 0, end: 1, text: "we" },
    { start: 1, end: 2, text: "we are" },
    { start: 2, end: 3, text: "we are" },
  ];
  assert.deepEqual(sliceCues(cues, { start: 0, end: 10 }), [{ start: 0, end: 3, text: "we are" }]);
});
