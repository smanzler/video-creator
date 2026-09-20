const ENDPOINT = "https://www.googleapis.com/youtube/v3/commentThreads";

export type Comment = { text: string; likeCount: number };

export type CommentOrder = "relevance" | "time";

export type FetchCommentsOptions = {
  videoId: string;
  apiKey: string;
  limit?: number;
  order?: CommentOrder;
};

type CommentSnippet = {
  textOriginal?: string;
  textDisplay?: string;
  likeCount?: number;
};

type CommentThreadPage = {
  items: {
    snippet: { topLevelComment: { snippet: CommentSnippet } };
    replies?: { comments: { snippet: CommentSnippet }[] };
  }[];
  nextPageToken?: string;
};

const pageComments = (page: CommentThreadPage): Comment[] =>
  page.items.flatMap((item) => {
    const top = item.snippet.topLevelComment.snippet;
    const replies = item.replies?.comments ?? [];
    return [top, ...replies.map((reply) => reply.snippet)].map((snippet) => ({
      text: snippet.textOriginal ?? snippet.textDisplay ?? "",
      likeCount: snippet.likeCount ?? 0,
    }));
  });

/** Reads the newest page first; `order: "relevance"` gives the comments that YouTube ranks high. */
export const fetchComments = async ({
  videoId,
  apiKey,
  limit = 500,
  order = "relevance",
}: FetchCommentsOptions): Promise<Comment[]> => {
  const comments: Comment[] = [];
  let pageToken: string | undefined;

  while (comments.length < limit) {
    const url = new URL(ENDPOINT);
    url.searchParams.set("part", "snippet,replies");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("maxResults", "100");
    url.searchParams.set("order", order);
    url.searchParams.set("textFormat", "plainText");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`YouTube comment API answered ${response.status}: ${body.slice(0, 500)}`);
    }

    const page = (await response.json()) as CommentThreadPage;
    comments.push(...pageComments(page));
    pageToken = page.nextPageToken;
    if (!pageToken) break;
  }

  return comments.slice(0, limit);
};
