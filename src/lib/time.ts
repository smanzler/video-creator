export type TimeParts = { hours: number; minutes: number; seconds: number; millis: number };

export const toSeconds = ({ hours = 0, minutes = 0, seconds = 0, millis = 0 }: Partial<TimeParts>): number =>
  hours * 3600 + minutes * 60 + seconds + millis / 1000;

const pad = (value: number, width = 2): string => String(value).padStart(width, "0");

const parts = (totalSeconds: number): TimeParts => {
  const clamped = Math.max(0, totalSeconds);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  const whole = Math.floor(clamped);
  return {
    hours: Math.floor(whole / 3600),
    minutes: Math.floor((whole % 3600) / 60),
    seconds: whole % 60,
    millis,
  };
};

export const formatTimecode = (totalSeconds: number): string => {
  const { hours, minutes, seconds } = parts(totalSeconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/** Comma decimal mark, as the SubRip format needs. */
export const formatSrtTime = (totalSeconds: number): string => {
  const { hours, minutes, seconds, millis } = parts(totalSeconds);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
};

/** Safe for a file name. */
export const formatCompact = (totalSeconds: number): string => {
  const { hours, minutes, seconds } = parts(totalSeconds);
  return hours > 0 ? `${hours}h${pad(minutes)}m${pad(seconds)}s` : `${minutes}m${pad(seconds)}s`;
};
