"use client";

import { Post } from "@/lib/types";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const patternBackgrounds = [
  "bg-amber-100 dark:bg-amber-900/30",
  "bg-stone-200 dark:bg-stone-800",
  "bg-orange-100 dark:bg-orange-900/30",
  "bg-yellow-50 dark:bg-yellow-900/20",
  "bg-rose-50 dark:bg-rose-900/20",
];

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const hasMedia = !!post.mediaUrl;
  const patternIndex =
    post.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    patternBackgrounds.length;

  return (
    <article
      className={`card-enter group overflow-hidden rounded-lg bg-card transition-shadow hover:shadow-lg ${
        featured ? "col-span-full" : ""
      }`}
    >
      {hasMedia && post.mediaType === "video" ? (
        <div className="overflow-hidden">
          <video
            src={post.mediaUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full"
          />
        </div>
      ) : hasMedia ? (
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.mediaUrl}
            alt={post.title}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
              featured ? "max-h-[32rem]" : ""
            }`}
          />
        </div>
      ) : (
        <div
          className={`flex min-h-[12rem] items-center justify-center p-8 ${patternBackgrounds[patternIndex]}`}
        >
          <span className="text-center text-2xl font-semibold leading-snug opacity-70">
            {post.title}
          </span>
        </div>
      )}
      <div className="p-4">
        {hasMedia && (
          <h2 className={`font-semibold leading-snug ${featured ? "text-lg" : ""}`}>
            {post.title}
          </h2>
        )}
        {!hasMedia && null}
        {post.description && (
          <p className={`${hasMedia ? "mt-1.5" : ""} text-sm leading-relaxed text-muted`}>
            {post.description}
          </p>
        )}
        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {safeHostname(post.linkUrl)}
          </a>
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
