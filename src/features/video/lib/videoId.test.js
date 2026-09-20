import assert from "node:assert/strict";
import test from "node:test";

import { parseVideoId } from "./videoId.js";

test("reads the id from every YouTube URL shape", () => {
  const id = "dQw4w9WgXcQ";
  assert.equal(parseVideoId(`https://www.youtube.com/watch?v=${id}&t=30s`), id);
  assert.equal(parseVideoId(`https://youtu.be/${id}?t=30`), id);
  assert.equal(parseVideoId(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(parseVideoId(`https://www.youtube.com/embed/${id}`), id);
  assert.equal(parseVideoId(id), id);
});

test("stops on input that holds no id", () => {
  assert.throws(() => parseVideoId("https://example.com/watch?v=short"), /Not a YouTube video/);
});
