"use client";

import { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      {post.imageUrl && (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold leading-snug">{post.title}</h2>
        {post.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {post.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <time className="ml-auto text-xs text-muted">{formattedDate}</time>
        </div>
      </div>
    </article>
  );
}
