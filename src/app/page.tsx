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
            <p className="text-lg text-muted">Nothing here yet.</p>
            <p className="mt-1 text-sm text-muted">
              Posts will show up once you add them from /admin.
            </p>
          </div>
        ) : (
          <div className="masonry">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
