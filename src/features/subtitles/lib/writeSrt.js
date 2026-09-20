import { writeFile } from "node:fs/promises";

import { formatSrtTime } from "../../../lib/time.js";

export const toSrt = (cues) =>
  cues
    .map((cue, index) => `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`)
    .join("\n");

export const writeSrt = async (filePath, cues) => {
  await writeFile(filePath, toSrt(cues), "utf8");
  return filePath;
};
