import { writeFile } from "node:fs/promises";

import { formatSrtTime } from "../../../lib/time.ts";
import type { Cue } from "./parseCaptions.ts";

export const toSrt = (cues: Cue[]): string =>
  cues
    .map((cue, index) => `${index + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`)
    .join("\n");

export const writeSrt = async (filePath: string, cues: Cue[]): Promise<string> => {
  await writeFile(filePath, toSrt(cues), "utf8");
  return filePath;
};
