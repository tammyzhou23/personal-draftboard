import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPosts, createPost, deletePost } from "@/lib/store";

export async function GET() {
  const posts = await getPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, imageUrl, tags } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const post = await createPost({
    title,
    description: description || "",
    imageUrl: imageUrl || "",
    tags: tags || [],
  });

  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  await deletePost(id);
  return NextResponse.json({ ok: true });
}
