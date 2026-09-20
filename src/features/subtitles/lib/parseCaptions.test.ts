import assert from "node:assert/strict";
import test from "node:test";

import { formatOf, parseCaptions } from "./parseCaptions.ts";

test("reads a vtt body without the word timing tags", () => {
  const body = [
    "WEBVTT",
    "",
    "00:00:01.000 --> 00:00:03.500",
    "hello <00:00:02.000><c>there</c>",
    "",
  ].join("\n");
  assert.deepEqual(parseCaptions(body, "vtt"), [{ start: 1, end: 3.5, text: "hello there" }]);
});

test("reads an srt body", () => {
  const body = ["1", "00:00:04,250 --> 00:00:06,000", "second line", ""].join("\n");
  assert.deepEqual(parseCaptions(body, "srt"), [{ start: 4.25, end: 6, text: "second line" }]);
});

test("picks the reader from the file name", () => {
  assert.equal(formatOf("a.en.vtt"), "vtt");
  assert.throws(() => formatOf("a.en.ass"), /No caption reader/);
});
