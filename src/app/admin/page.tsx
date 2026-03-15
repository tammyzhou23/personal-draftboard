"use client";

import { useState, useEffect, useCallback } from "react";
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
    imageUrl: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => {
    // Check if already authenticated by trying to fetch
    fetch("/api/posts").then((res) => {
      if (res.ok) fetchPosts();
    });
  }, [fetchPosts]);

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
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    if (res.ok) {
      setForm({ title: "", description: "", imageUrl: "", tags: "" });
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
          <h1 className="text-2xl font-semibold">Admin</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-10 flex flex-col gap-4 rounded-lg border border-border bg-card p-6"
        >
          <h2 className="font-medium">New Post</h2>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent resize-none"
          />
          <input
            placeholder="Image URL (optional)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            placeholder="Tags, comma separated (optional)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="self-end rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Posts ({posts.length})</h2>
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="font-medium text-sm">{post.title}</p>
                <p className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-xs text-red-500 hover:text-red-400 transition-colors"
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
