const PATH_HOSTS = new Set(["youtu.be"]);
const PATH_PREFIXES = ["/embed/", "/shorts/", "/live/", "/v/"];
const ID = /^[\w-]{11}$/;

/** Takes the 11 character id out of a YouTube URL, or passes an id through. */
export const parseVideoId = (input) => {
  const value = input.trim();
  if (ID.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Not a YouTube video URL or id: ${input}`);
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && ID.test(fromQuery)) return fromQuery;

  if (PATH_HOSTS.has(url.hostname.replace(/^www\./, ""))) {
    const candidate = url.pathname.slice(1);
    if (ID.test(candidate)) return candidate;
  }

  for (const prefix of PATH_PREFIXES) {
    if (!url.pathname.startsWith(prefix)) continue;
    const candidate = url.pathname.slice(prefix.length).split("/")[0];
    if (ID.test(candidate)) return candidate;
  }

  throw new Error(`Not a YouTube video URL or id: ${input}`);
};
