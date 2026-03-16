"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Post } from "@/lib/types";

function isVideo(file: File) {
  return file.type.startsWith("video/");
}

function isMedia(file: File) {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    linkUrl: "",
    tags: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: Post["mediaType"] } | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (res.ok) setPosts(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthed(true);
          fetchPosts();
        }
      });
  }, [fetchPosts]);

  useEffect(() => {
    if (!file) {
      if (!existingMedia) {
        setPreview(null);
        setPreviewType(null);
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setPreviewType(isVideo(file) ? "video" : "image");
    return () => URL.revokeObjectURL(url);
  }, [file, existingMedia]);

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", linkUrl: "", tags: "" });
    setFile(null);
    setPreview(null);
    setPreviewType(null);
    setExistingMedia(null);
    setRemoveMedia(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      description: post.description,
      linkUrl: post.linkUrl || "",
      tags: post.tags.join(", "),
    });
    setFile(null);
    setRemoveMedia(false);
    if (post.mediaUrl) {
      setExistingMedia({ url: post.mediaUrl, type: post.mediaType });
      setPreview(post.mediaUrl);
      setPreviewType(post.mediaType === "video" ? "video" : "image");
    } else {
      setExistingMedia(null);
      setPreview(null);
      setPreviewType(null);
    }
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleFile(f: File | null) {
    if (f && isMedia(f)) {
      setFile(f);
      setExistingMedia(null);
      setRemoveMedia(false);
    }
  }

  function handleRemoveMedia(e: React.MouseEvent) {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setPreviewType(null);
    setExistingMedia(null);
    setRemoveMedia(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  async function uploadFile(): Promise<{ url: string; mediaType: Post["mediaType"] }> {
    if (!file) return { url: "", mediaType: "" };
    const uploadData = new FormData();
    uploadData.append("file", file);
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });
    if (uploadRes.ok) {
      const data = await uploadRes.json();
      return { url: data.url, mediaType: data.mediaType };
    }
    return { url: "", mediaType: "" };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      let mediaUrl: string | undefined;
      let mediaType: Post["mediaType"] | undefined;
      if (file) {
        const uploaded = await uploadFile();
        mediaUrl = uploaded.url;
        mediaType = uploaded.mediaType;
      } else if (removeMedia) {
        mediaUrl = "";
        mediaType = "";
      }

      await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: form.title,
          description: form.description,
          linkUrl: form.linkUrl,
          tags,
          ...(mediaUrl !== undefined && { mediaUrl }),
          ...(mediaType !== undefined && { mediaType }),
        }),
      });
    } else {
      const uploaded = await uploadFile();
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          mediaUrl: uploaded.url,
          mediaType: uploaded.mediaType,
          linkUrl: form.linkUrl,
          tags,
        }),
      });
    }

    resetForm();
    fetchPosts();
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (editingId === id) resetForm();
    fetchPosts();
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;
    const ids = posts.map((p) => p.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    const res = await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (res.ok) setPosts(await res.json());
  }

  async function handleMoveDown(index: number) {
    if (index === posts.length - 1) return;
    const ids = posts.map((p) => p.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    const res = await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (res.ok) setPosts(await res.json());
  }

  function handleRowDragStart(index: number) {
    setDragIdx(index);
  }

  function handleRowDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIdx(index);
  }

  async function handleRowDrop(index: number) {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const ids = posts.map((p) => p.id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(index, 0, moved);
    setDragIdx(null);
    setDragOverIdx(null);
    const res = await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (res.ok) setPosts(await res.json());
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
          <h1 className="text-2xl font-semibold">
            {editingId ? "Edit Post" : "Compose"}
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
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
              accept="image/*,video/*"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                {previewType === "video" ? (
                  <video
                    src={preview}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full rounded-lg max-h-80"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Upload preview"
                    className="w-full rounded-lg object-contain max-h-80"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
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
                  Drop an image or video here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted/50">
                  PNG, JPG, GIF, WebP, MP4, MOV, WebM
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5">
            <svg className="h-4 w-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              placeholder="Live URL (Figma, demo, website...)"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/50"
            />
          </div>

          <input
            placeholder="Tags, comma separated"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="bg-transparent text-sm outline-none placeholder:text-muted/50"
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? editingId
                  ? "Saving..."
                  : "Posting..."
                : editingId
                  ? "Save Changes"
                  : "Publish"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Posts ({posts.length})</h2>
          {posts.length === 0 && (
            <p className="text-sm text-muted py-4">No posts yet.</p>
          )}
          {posts.map((post, index) => (
            <div
              key={post.id}
              draggable
              onDragStart={() => handleRowDragStart(index)}
              onDragOver={(e) => handleRowDragOver(e, index)}
              onDrop={() => handleRowDrop(index)}
              onDragEnd={() => {
                setDragIdx(null);
                setDragOverIdx(null);
              }}
              className={`flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors ${
                editingId === post.id
                  ? "border-accent"
                  : dragOverIdx === index
                    ? "border-accent/50"
                    : "border-border"
              }`}
            >
              {/* Drag handle */}
              <div className="cursor-grab text-muted/40 hover:text-muted shrink-0">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              {post.mediaUrl && post.mediaType === "video" ? (
                <div className="h-10 w-10 rounded bg-muted/20 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-muted" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : post.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.mediaUrl}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleDateString()}
                  {post.mediaType === "video" && " · Video"}
                </p>
              </div>

              {/* Move arrows */}
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === posts.length - 1}
                  className="text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={() => startEdit(post)}
                className="text-xs text-accent hover:underline transition-colors shrink-0"
              >
                Edit
              </button>
              <button
                type="button"
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
