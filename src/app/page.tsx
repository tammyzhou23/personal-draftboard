import { getPosts } from "@/lib/store";
import { PostCard } from "@/components/PostCard";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 text-6xl opacity-30 select-none" aria-hidden="true">
              &#9998;
            </div>
            <p className="text-xl font-medium text-foreground/70">Watch this space</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              New work, experiments, and ideas will appear here as they come together.
            </p>
          </div>
        ) : (
          <div className="masonry">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} featured={index === 0} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
