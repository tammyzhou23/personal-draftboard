import { createClient } from "@vercel/kv";
import { Post, normalizePost } from "./types";

const POSTS_KEY = "draftboard:posts";

function getKv() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return null;
  }
  return createClient({ url, token });
}

export async function getPosts(): Promise<Post[]> {
  const kv = getKv();
  if (!kv) return [];
  const raw = await kv.get<Record<string, unknown>[]>(POSTS_KEY);
  return (raw ?? []).map(normalizePost);
}

export async function createPost(
  post: Omit<Post, "id" | "createdAt">
): Promise<Post> {
  const kv = getKv();
  if (!kv) throw new Error("KV store not configured");
  const posts = await getPosts();
  const newPost: Post = {
    ...post,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await kv.set(POSTS_KEY, [newPost, ...posts]);
  return newPost;
}

export async function deletePost(id: string): Promise<void> {
  const kv = getKv();
  if (!kv) throw new Error("KV store not configured");
  const posts = await getPosts();
  await kv.set(
    POSTS_KEY,
    posts.filter((p) => p.id !== id)
  );
}

export async function reorderPosts(orderedIds: string[]): Promise<Post[]> {
  const kv = getKv();
  if (!kv) throw new Error("KV store not configured");
  const posts = await getPosts();
  const postMap = new Map(posts.map((p) => [p.id, p]));
  const reordered: Post[] = [];
  for (const id of orderedIds) {
    const post = postMap.get(id);
    if (post) {
      reordered.push(post);
      postMap.delete(id);
    }
  }
  // append any posts not in the ordered list
  for (const post of postMap.values()) {
    reordered.push(post);
  }
  await kv.set(POSTS_KEY, reordered);
  return reordered;
}

export async function updatePost(
  id: string,
  updates: Partial<Omit<Post, "id" | "createdAt">>
): Promise<Post | null> {
  const kv = getKv();
  if (!kv) throw new Error("KV store not configured");
  const posts = await getPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...updates };
  await kv.set(POSTS_KEY, posts);
  return posts[index];
}
