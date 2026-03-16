export interface Post {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "";
  linkUrl: string;
  tags: string[];
  createdAt: string;
}

/** Backwards-compat: old posts only have imageUrl */
export function normalizePost(raw: Record<string, unknown>): Post {
  return {
    id: raw.id as string,
    title: raw.title as string,
    description: (raw.description as string) || "",
    mediaUrl: (raw.mediaUrl as string) || (raw.imageUrl as string) || "",
    mediaType: (raw.mediaType as Post["mediaType"]) || ((raw.imageUrl || raw.mediaUrl) ? "image" : ""),
    linkUrl: (raw.linkUrl as string) || "",
    tags: (raw.tags as string[]) || [],
    createdAt: raw.createdAt as string,
  };
}
