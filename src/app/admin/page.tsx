"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Post } from "@/lib/types";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/posts").then((res) => {
      if (res.ok) fetchPosts();
    });
  }, [fetchPosts]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(f: File | null) {
    if (f && f.type.startsWith("image/")) {
      setFile(f);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
      fetchPosts();
    } else {
      setError("Wrong password");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = "";
    if (file) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        imageUrl = url;
      }
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        imageUrl,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    if (res.ok) {
      setForm({ title: "", description: "", tags: "" });
      setFile(null);
      fetchPosts();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchPosts();
  }

  if (!authed) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-sm px-6 py-20">
          <h1 className="mb-6 text-2xl font-semibold">Admin</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Log in
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Compose</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-10 flex flex-col gap-5 rounded-lg border border-border bg-card p-6"
        >
          <input
            placeholder="Add a title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="bg-transparent text-xl font-semibold outline-none placeholder:text-muted/50"
          />

          <textarea
            placeholder="Write a description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted/50 resize-none"
          />

          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
              dragging
                ? "border-accent bg-accent/5"
                : preview
                  ? "border-border"
                  : "border-border hover:border-muted"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Upload preview"
                  className="w-full rounded-lg object-contain max-h-80"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white hover:bg-black/80 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  className="mb-3 h-8 w-8 text-muted/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 16v-8m0 0l-3 3m3-3l3 3M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12z"
                  />
                </svg>
                <p className="text-sm text-muted">
                  Drop an image here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted/50">
                  PNG, JPG, GIF, WebP
                </p>
              </div>
            )}
          </div>

          <input
            placeholder="Tags, comma separated"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="bg-transparent text-sm outline-none placeholder:text-muted/50"
          />

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Publish"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Posts ({posts.length})</h2>
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-xs text-red-500 hover:text-red-400 transition-colors shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
